// ######################### rest API for tracking and untracking phrases, which is useful mostly for testing needs ###########################
var twitterAgent = require('../services/twitterAgent')
	,phraseModel = require('../models/phraseModel');
	
var phraseType = function(phrase) {
	if(phrase.indexOf('#') == 0 && phrase.indexOf(' ') == -1) {
		return 'hashtag';
	} 
	// dummy check 
	if(phrase.indexOf('http://') == 0 || phrase.indexOf('https://') == 0) {
		return 'url';
	}
	
	return 'verbal';
}

var trackList = function(data) {
	var trackList=[];
	for(var i=0; i<data.length; i++) {
		trackList.push(data[i].text);
	}
	return trackList;
}

module.exports.track = function(req, res) {
	var newPhrase = req.body.phrase;
	if(!newPhrase) {
		res.send(400, "Invalid phrase!");
		return;
	}
	
	var phrase = new phraseModel({text: newPhrase, type: phraseType(newPhrase)});
	phrase.save(function (err) {
		if (err) {
			if(err.code == 11000) {
				res.set('Location', '/phrases/' + encodeURIComponent(newPhrase));
				res.send(301);
			} else {
				console.error(err);
				res.send(500);
			}
			return;
		}
		console.info('Added new phrase: ' + newPhrase);
		// get all current phrases
		phraseModel.find({}, 'text', function(err, data) {
			if(err) {
				console.error(err);
				res.send(500);
				return;
			}
			
			twitterAgent.track(trackList(data));
			res.set('Location', '/phrases/' + encodeURIComponent(newPhrase));
			res.send(201, "Enabled tracking of " + newPhrase);
		});
	});
}

module.exports.untrack = function(req, res) {
	var phrase = req.params.phrase;
	
	phraseModel.findOneAndRemove({text: phrase}, function(err, data) {
		if(err) {
			console.error(err);
			res.send(500);
			return;
		}
		
		if(!data) {
			res.send(404);
			return;
		}
		
		console.info('Disabled tracking of ' + phrase);
		// get all current phrases
		phraseModel.find({}, 'text', function(err, data) {
			if(err) {
				console.error(err);
				res.send(500);
				return;
			}
			
			twitterAgent.track(trackList(data));
			res.send(200, "Disabled tracking of " + phrase);
		});
	});
}