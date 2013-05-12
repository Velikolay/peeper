var tweetModel = require('../models/tweetModel')
	,phraseModel = require('../models/phraseModel')
	,twitterAgent = require('../services/twitterAgent')
	,observerService = require('../services/observerService')
	,Quiche = require('quiche');

exports.search = function (req, res) {
	var phrase = req.query.phrase;
	var newPhrase = new phraseModel({text: phrase, type: phraseType(phrase)});
	newPhrase.save(function (err) {
		if (err) {
			if(err.code == 11000) {
				textSearch(phrase, false, res);
			} else {
				console.error(err);
				res.send(500);
			}
			return;
		}
		console.info('Added new phrase: ' + phrase);
		// get all current phrases
		phraseModel.find({}, 'text', function(err, data) {
			if(err) {
				console.error(err);
				res.send(500);
				return;
			}
			// renew the list of phrases being tracked
			twitterAgent.track(trackList(data));
			observerService.keepUpdated(phrase);
			// return results to the user and ensure that
			// he will be recieving regular updates via websocket
			textSearch(phrase, true, res)
		});
	});
}

var textSearch = function(phrase, firstSearch, res) {
	tweetModel.textSearch("\"" + phrase + "\"", { filter: { processed: true }, limit: 40 }, function (err, data) {
		if (err) {
			console.error(err);
			res.send(500);
			return;
		}
		
		data.results.sort(byTweetDate);
		if(firstSearch && data.results.length > 0) {
			console.log("Initial aggregation of sentiment data for " + phrase);
			phraseModel.findOne({text: phrase}, function(err, obj) {
				if(err) {
					console.error(err);
					data.context = { text: phrase };
					res.render('index', { data: data, trackList: JSON.stringify([phrase]), pieChartURL:null} );
					return;
				}
				obj.updateSentimentData(data.results, function(err) { // initial aggregation of sentiment data
					if(err) {
						console.error(err); //TODO add better error handling in future
					}
					data.context = obj;
					res.render('index', { data: data, trackList: JSON.stringify([phrase]), pieChartURL:null} );
				}); 
			});
		} else {
			phraseModel.findOne({text: phrase}, function(err, obj) {
				if(err) {
					console.error(err);
				}
				console.log(obj);
				var imageUrl = null;
				
				if(obj != null) {
					var pie = new Quiche('pie');
					pie.setTransparentBackground(); // Make background transparent
					pie.set3D();
					pie.addData(obj.sentiment.totalPositive, 'Positive', '5EB95E');
					pie.addData(obj.sentiment.totalNeutral, 'Neutral', '0e90d2');
					pie.addData(obj.sentiment.totalNegative, 'Negative', 'DD514C');

					var imageUrl = pie.getUrl(true);
				}

				data.context = { text: phrase };
				res.render('index', { data: data, trackList: JSON.stringify([phrase]), pieChartURL:imageUrl} );
			});
		}
	});
}

var byTweetDate = function(a, b) {
	var dateA = new Date(a.obj.created_at).getTime();
	var dateB = new Date(b.obj.created_at).getTime();
	return dateB - dateA;
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
		trackList.push(data[i].text);
	}
	return trackList;
}