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
        '48Hours': getPlaysHours(req.param('id'), 48)
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
