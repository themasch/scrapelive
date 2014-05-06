var request = require('request')
  , cheerio = require('cheerio')
  , moment  = require('moment')
  , crypto  = require('crypto')
  , mongoose = require('./mongoose.js')
  , Promise  = require('bluebird')

var Track    = mongoose.model('Track')
var Playtime = mongoose.model('Playtime')

scrape().then(function() {
    mongoose.connection.close()
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
                    var itime = $('td', this).first().text()
                    time = moment(
                        itime.replace(/[A-Za-z]{3}\s+/, '')
                             .replace('CEST', '+0200')
                             .replace('CET',  '+0100'),
                        [ 'HH:mm:ss',  'MMM DD HH:mm:ss ZZ YYYY']
                    )
                    var artist = $('td', this).eq(1).text()
                    var track = $('td', this).eq(2).text()
                    //console.log(time.unix(), hash)
                    var t = new Track({
                        _id: crypto.createHash('md5').update(artist + ' ' + track).digest('hex'),
                        artist: artist,
                        title: track
                    })
                    models.push(t)
                    console.log(time._d, itime)
                    try {
                        var p = new Playtime({
                            date: time._d,
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
