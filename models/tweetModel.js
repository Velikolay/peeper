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
	processed: { type: Boolean, default: false},
	profile_image_url: {type: String, default: '#'},
	sentiment: { // neutral by default, or is it better if unset, so that the sentiment service can evaluate it when available again?
		positive: {type: Number, default: 1},
		negative: {type: Number, default: -1},
		polarity: {type: Number, default: 0}
	}
});

tweetSchema.plugin(textSearch);
tweetSchema.index({ text: 'text'});
//tweetSchema.index({ processed: 1, description: 'text'});
module.exports = mongoose.model('tweets', tweetSchema);