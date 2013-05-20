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
					res.render('index', { data: data, trackList: JSON.stringify([phrase]), charts:null} );
					return;
				}
				obj.updateSentimentData(data.results, function(err) { // initial aggregation of sentiment data
					if(err) {
						console.error(err); //TODO add better error handling in future
					}
					data.context = obj;
					res.render('index', { data: data, trackList: JSON.stringify([phrase]), charts:null} );
				}); 
			});
		} else {
			phraseModel.findOne({text: phrase}, function(err, obj) {
				if(err) {
					console.error(err);
				}
				console.log(obj);
				var charts = {};
				
				if(obj != null) {
					charts = getCharts(obj.sentiment);
				}

				data.context = { text: phrase };
				res.render('index', { data: data, trackList: JSON.stringify([phrase]), charts:charts} );
			});
		}
	});
}

exports.getCharts = getCharts = function(sentiment) {
	var total = sentiment.totalPositive + sentiment.totalNeutral + sentiment.totalNegative;
	var pie = new Quiche('pie');
	pie.setTitle('Total');
	pie.setWidth(700);
	pie.setTransparentBackground();
	pie.set3D();
	pie.addData(sentiment.totalPositive, 'Positive', '5EB95E');
	pie.addData(sentiment.totalNeutral, 'Neutral', '0e90d2');
	pie.addData(sentiment.totalNegative, 'Negative', 'DD514C');
	pie.setLegendHidden();
	pie.addAxisLabels('x', ['Positive ' + (sentiment.totalPositive/total*100).toFixed(2) + '%', 
		'Neutral ' + (sentiment.totalNeutral/total*100).toFixed(2) + '%',
		'Negative ' + (sentiment.totalNegative/total*100).toFixed(2) + '%']);

	var bar = new Quiche('bar');
	bar.setWidth(700);
	bar.setTitle('Day by day statistic');
	bar.setLegendBottom();
	bar.setBarStacked();
	bar.setTransparentBackground();
	bar.setAutoScaling();
	var positive = [];
	var neutral = [];
	var negative = [];
	var x = [];
	for(var i=1; i<32; ++i) {
		x.push(i);
		if(sentiment && sentiment.dateAnalysis && sentiment.dateAnalysis[i]) {
			positive.push(sentiment.dateAnalysis[i].totalPositive);
			neutral.push(sentiment.dateAnalysis[i].totalNeutral);
			negative.push(sentiment.dateAnalysis[i].totalNegative);
		} else {
			positive.push(0);
			neutral.push(0);
			negative.push(0);
		}
	}
	bar.addData(positive, 'Positive', '5EB95E');
	bar.addData(neutral, 'Neutral', '0e90d2');
	bar.addData(negative, 'Negative', 'DD514C');

	bar.addAxisLabels('x', x);

	var charts = {
		pieChart : pie.getUrl(true),
		barChart : bar.getUrl(true)
	};

	return charts;
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