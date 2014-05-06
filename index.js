var request = require('request')
  , cheerio = require('cheerio')
  , moment  = require('moment')
  , crypto  = require('crypto')
  , mongoose = require('mongoose')
  , Promise  = require('bluebird')

mongoose.connect('mongodb://localhost/1live')

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var trackSchema = mongoose.Schema({
    _id:    String,
    artist: String,
    title:  String
})

var playtimeSchema = mongoose.Schema({
    _id: String,
    date: Date,
    track: { type: String, ref: 'Track' },
})

playtimeSchema.pre('save', function(next) {
    if(this.isModified()) {
        this._id = crypto.createHash('md5').update(this.track + ' ' + this.date.getTime()).digest('hex')
    }
    next()
})

var Track = mongoose.model('Track', trackSchema)
var Playtime = mongoose.model('Playtime', playtimeSchema)


scrape().then(function() {
    db.close(function() {})
}, function(err) {
    console.error(err)
})

function scrape() {
    var url = 'http://www.einslive.de/musik/playlists/index.jsp'
    return new Promise(function(solve, reject) {
        request.get({
                url: url,
                encoding: 'binary'
            },
            function(err, res) {
                var $ = cheerio.load(res.body.toString())
                var models = []
                $('.wsPlaylistsEL tbody tr').each(function(row) {
                    var time = $('td', this).first().text()
                    time = moment(time, 'HH:mm:ss')
                    var artist = $('td', this).eq(1).text()
                    var track = $('td', this).eq(2).text()
                    //console.log(time.unix(), hash)
                    var t = new Track({
                        _id: crypto.createHash('md5').update(artist + ' ' + track).digest('hex'),
                        artist: artist,
                        title: track
                    })
                    models.push(t)
                    try {
                        var p = new Playtime({
                            date: time,
                            track: t._id
                        })
                    } catch(e) {
                        console.log(e)
                        console.log(time)
                    }
                    models.push(p)
                })

                var cnt = 0
                Promise.map(models, function(track) {
                    return new Promise(function(yep, nope) {
                        track.save(function(err) {
                            if(err) {
                                if(err.code !== 11000) {
                                    nope(err)
                                } else {
                                    yep()
                                }
                            } else {
                                yep()
                            }
                        })
                    })
                }).then(solve, reject)
            })
    })
}
