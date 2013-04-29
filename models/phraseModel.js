var mongoose = require('mongoose')
	,Schema = mongoose.Schema
	,ObjectId = Schema.ObjectId;

var phraseSchema = new Schema({
	_id: ObjectId,
	actual: { type: String, unique: true },
	type: String
});

phraseSchema.path('actual').index({ unique: true });
module.exports = mongoose.model('phrases', phraseSchema);