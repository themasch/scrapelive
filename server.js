var express  = require('express')
  , mongoose = require('./mongoose.js')
  , Promise  = require('bluebird')
  , moment   = require('moment')
  , app      = express()


app.get('/tracks/:id', function(req, res) {
    Promise.props({
        id: req.param('id'),
        total: getTotalPlays(req.param('id')),
        lastHour: getPlaysHours(req.param('id'), 1),
        '12Hours': getPlaysHours(req.param('id'), 12),
        '24Hours': getPlaysHours(req.param('id'), 24),
        '48Hours': getPlaysHours(req.param('id'), 48),
        track: getTrackDetails(req.param('id'))
    }).then(function(data) {
        res.send(data)
    })
})

app.get('/tracks', function(req, res) {
    mongoose.model('Playtime')
            .find()
            .sort('-date')
            .limit(req.param('count') || 10)
            .populate('track')
            .exec(function(err, docs) {
                res.send(docs)
            })
})

app.get('/topTracks', function(req, res) {
    getMostPlayed(parseInt(req.param('count') || 20)).then(res.send.bind(res))
})

app.get('/stats', function(req, res) {
    Promise.props({
        tracks: totalTrackCount(),
        plays: totalPlayCount()
    }).then(res.send.bind(res), res.send.bind(res, 501))
})

function getMostPlayed(count) {
    return new Promise(function(res, rej) {
        try {
            mongoose.model('Playtime')
                .aggregate([
                    { $group: { _id: '$track' , count: { $sum: 1 } } },
                    { $sort:  { count:  -1} },
                    { $limit: count }
                ],
                function(err, docs) {
                    if(err) {
                        return rej(err)
                    }
                    Promise.map(docs, function(doc) {
                        return getTrackDetails(doc._id)
                                .then(function(track) {
                                    track = track.toObject()
                                    track.count = doc.count
                                    return track
                                })
                    }).then(res)
                })
        } catch(ex) {
            rej(ex)
        }
    })
}

function getTrackDetails(id) {
    return new Promise(function(res, rej) {
        mongoose.model('Track')
            .findById(id)
            .select('-__v')
            .exec(function(err, cnt) {
                if(err) {
                    return rej(err)
                }
                return res(cnt)
            })
    })
}

function totalTrackCount() {
    return new Promise(function(res, rej) {
        mongoose.model('Track')
                .count()
                .exec(function(err, cnt) {
                    if(err) {
                        return rej(err)
                    }
                    return res(cnt)
                })
    })
}
function totalPlayCount() {
    return new Promise(function(res, rej) {
        mongoose.model('Playtime')
                .count()
                .exec(function(err, cnt) {
                    if(err) {
                        return rej(err)
                    }
                    return res(cnt)
                })
    })
}

function getTotalPlays(id) {
    return new Promise(function(res, rej) {
        mongoose.model('Playtime')
                .count({ track: id })
                .exec(function(err, cnt) {
                    if(err) {
                        return rej(err)
                    }
                    return res(cnt)
                })
    })
}

function getPlaysHours(id, hours) {
    return new Promise(function(res, rej) {
        mongoose.model('Playtime')
                .count({
                    track: id,
                    date: { $gt: moment().subtract('hours', hours)._d}
                })
                .exec(function(err, cnt) {
                    if(err) {
                        return rej(err)
                    }
                    return res(cnt)
                })
    })
}


app.use(express.static(__dirname + '/public'))
app.listen(9090)
