var mongoose = require('mongoose')
  , crypto   = require('crypto')
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

module.exports = mongoose
