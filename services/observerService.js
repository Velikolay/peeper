var tweetModel = require('../models/tweetModel'),
	phraseModel = require('../models/phraseModel');

var hashmap = {};
var sleepIntervalMili = 5000;
var isStarted = false;

var observe = function() {
	if(!isStarted) {
		return;
	}
	var keys = Object.keys(hashmap);
	var tasks = keys.length;
	
	if(!tasks) {
		setTimeout(observe, sleepIntervalMili);
		return;
	}
	var processedTweets = {};
	
	var finalizeAndScheduleNextIterationIfNoMoreTasks = function(tasks) {
		if(!tasks) {
			console.log("###### processed tweets " + Object.keys(processedTweets).length);
			updateAllProcessedInDB(processedTweets, function() {
				setTimeout(observe, sleepIntervalMili);
			});
		}
	}
	
	var updateListeners = function(phrase, results) {
		var cbs = hashmap[phrase];
		for(var i=0; i<cbs.length; i++) {
			cbs[i](results);
		}
	}
	
	var updateProcessed = function(results) {
		for(var i=0; i<results.length; i++) {
			tweet = results[i].obj;
			processedTweets[tweet._id] = tweet;
		}
	}
	
	for(var i=0; i<keys.length; i++) {
		var key = keys[i];
		console.log(key);
		tweetModel.textSearch("\"" + key + "\"", { filter: { processed: false } }, function (err, data) {
			--tasks;
			
			if (err) {
				console.error(err);
				finalizeAndScheduleNextIterationIfNoMoreTasks(tasks);
				return;
			}
			console.log(data);
			var results = data.results;
			if(results.length > 0) {
				console.log("Subsequent aggregation of sentiment data for " + key);
				phraseModel.findOne({ text: key }, function(err, obj) {
					if(err) {
						console.error(err);
						data.context = { text: key };
						updateListeners(key, data);
						updateProcessed(results);
						finalizeAndScheduleNextIterationIfNoMoreTasks(tasks);
					} else {
						obj.updateSentimentData(results, function(err) { // continuous aggregation of sentiment data
							if(err) {
								console.error(err); //TODO add error handling in future
							}
							data.context = obj;
							console.info(data);
							updateListeners(key, data);
							updateProcessed(results);
							finalizeAndScheduleNextIterationIfNoMoreTasks(tasks);
						});
					}
				});
			} else {
				finalizeAndScheduleNextIterationIfNoMoreTasks(tasks);
			}
		});
	}
}

var updateAllProcessedInDB = function(tweetsMap, cbFinished) {
	var keys = Object.keys(tweetsMap);
	var tasks = keys.length;
	
	if(!tasks) {
		cbFinished();
		return;
	}
	
	for(var i=0; i<keys.length; i++) {
		tweetModel.update({_id: keys[i]}, { processed: true }, function (err, numberAffected, rawResponse) {
			--tasks;
			if(err) {
				console.error(err);
			}
			if(numberAffected && numberAffected != 1) {
				throw new Error("observerService#updateAllProcessedInDB intends to update only one document at a time, but the updated were "
				 + numberAffected + ".\nRaw response: " + rawResponse);
			}
			
			if(!tasks) {
				cbFinished();
			}
		});
	}
}

module.exports.notifyFor = notifyFor = function(phrase, callback) {
	var cbs = hashmap[phrase];
	if(cbs) {
		cbs.push(callback);
		hashmap[phrase] = cbs;
	} else {
		hashmap[phrase] = [ callback ];
	}
}

module.exports.keepUpdated = keepUpdated = function(phrase) {
	var cbs = hashmap[phrase];
	if(!cbs) {
		hashmap[phrase] = [];
	}
}

module.exports.start = start = function() {
	if(this.isStarted == true) {
		console.warn("The observer is already started");
		return;
	}
	
	isStarted = true;
	observe();
}

module.exports.stop = stop = function() {
	isStarted = false;
}

// TEST
/*var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/dev");

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.info("DB connection successfull!");
	start();
	setTimeout(function() {
		notifyFor("mcdonalds", function(res) {
			console.log(res);
		});
	}, 2000);
	setTimeout(stop, 20000);
});*/