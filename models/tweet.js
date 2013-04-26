var mongoose = require('mongoose')
	,textSearch = require('mongoose-text-search')
	,Schema = mongoose.Schema
	,ObjectId = Schema.ObjectId;

var tweetSchema = new Schema({
	_id : Number,
	text: String,
	user: String,
	created_at: {type: Date, default: Date.now},
	lang: {type: String, default: 'en'},
	pos_sentiment: Number,
	neg_sentiment: Number,
	sentiment_polarity: Number 
});

tweetSchema.plugin(textSearch);
tweetSchema.index({ text: 'text'});
module.exports = mongoose.model('Tweet', tweetSchema);