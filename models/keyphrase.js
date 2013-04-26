var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId
   ,Tweet = require('./tweet.js');

var keyPhraseSchema = new Schema({
    id : ObjectId,
    phrase : String,
    date: {type: Date, default: Date.now},
    tweets: [ Tweet ]
});

module.exports = mongoose.model('KeyPhrase', keyPhraseSchema);