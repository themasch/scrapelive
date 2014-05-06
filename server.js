var express  = require('express')
  , mongoose = require('./mongoose.js')
  , app      = express()

app.use(express.static(__dirname + '/public'))
app.listen(9090)

app.get('/tracks/last10', function(req, res) {
    mongoose.model('Playtime')
            .find()
            .sort('-date')
            .limit(10)
            .populate('track')
            .exec(function(err, docs) {
                res.send(docs)
            })
})
