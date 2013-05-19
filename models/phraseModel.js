var mongoose = require('mongoose')
	,Schema = mongoose.Schema
	,ObjectId = Schema.ObjectId;

var phraseSchema = new Schema({
	_id: ObjectId,
	text: { type: String, unique: true },
	type: String,
	sentiment: { // aggregated value of the total sentiment for a given phrased
		totalPositive: {type: Number, default: 0},
		totalNeutral: {type: Number, default: 0},
		totalNegative: {type: Number, default: 0},
		dateAnalysis: {}
	}
});

phraseSchema.path('text').index({ unique: true });

phraseSchema.methods.updateSentimentData = function(results, cb) { // handles aggregation of sentiment data
	if ('function' != typeof cb) {
		throw new TypeError('updateSentimentData: callback is required');
	}
	for(var i=0; i<results.length; i++) {
		if(!this.sentiment.dateAnalysis) {
			this.sentiment.dateAnalysis = {};
		}
		var today = new Date().getDate();
		if(!this.sentiment.dateAnalysis[today]) {
			this.sentiment.dateAnalysis[today] = {
				totalPositive : 0,
				totalNeutral : 0,
				totalNegative : 0
			};
		}
		if(results[i].obj.sentiment.polarity == 1) {
			this.sentiment.totalPositive++;
			this.sentiment.dateAnalysis[today].totalPositive++;
		} else if(results[i].obj.sentiment.polarity == 0) {
			this.sentiment.totalNeutral++; 
			this.sentiment.dateAnalysis[today].totalNeutral++;
		} else {
			this.sentiment.totalNegative++;
			this.sentiment.dateAnalysis[today].totalNegative++;
		}
	}
	this.markModified('sentiment');
	this.save(function(err) {
		if(err) {
			cb(err);
			return;
		}
		cb();
	});
}

module.exports = mongoose.model('phrases', phraseSchema);