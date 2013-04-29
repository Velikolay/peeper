var tweetModel = require('../models/tweetModel')
	,phraseModel = require('../models/phraseModel')
	,twitterAgent = require('../services/twitterAgent');

exports.search = function (req, res) {
	var phrase = req.query.phrase;
	var newPhrase = new phraseModel({actual: phrase, type: phraseType(phrase)});
	newPhrase.save(function (err) {
		if (err) {
			if(err.code == 11000) {
				textSearch(phrase, res);
			} else {
				console.error(err);
				res.send(500);
			}
			return;
		}
		console.info('Added new phrase: ' + phrase);
		// get all current phrases
		phraseModel.find({}, 'actual', function(err, data) {
			if(err) {
				console.error(err);
				res.send(500);
				return;
			}
			// renew the list of phrases being tracked
			twitterAgent.track(trackList(data));
			// return results to the user and ensure that
			// he will be recieving regular updates via websocket
			textSearch(phrase, res);
		});
	});
}

var textSearch = function(phrase, res) {
	tweetModel.textSearch("\"" + phrase + "\"", { filter: { delivered: true } }, function (err, data) {
		if (err) {
			console.error(err);
			res.send(500);
		} else {
			res.render('index', { data: data, trackList: JSON.stringify([phrase])} );
		}
	});
}

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
		trackList.push(data[i].actual);
	}
	return trackList;
}