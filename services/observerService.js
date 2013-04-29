var tweetModel = require('../models/tweetModel');

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
	var deliveredTweets = {};
	for(var i=0; i<keys.length; i++) {
		var key = keys[i];
		tweetModel.textSearch("\"" + key + "\"", { filter: { delivered: false } }, function (err, data) {
			--tasks;
			if (err) {
				console.error(err);
			} else {
				var results = data.results;
				if(results.length > 0) {
					var cbs = hashmap[key];
					for(var i=0; i<cbs.length; i++) {
						cbs[i](results);
					}
					
					for(var i=0; i<results.length; i++) {
						tweet = results[i].obj;
						deliveredTweets[tweet._id] = tweet;
					}
				}
			}
			
			if(!tasks) {
				console.log("###### delivered tweets " + Object.keys(deliveredTweets).length);
				updateDelivered(deliveredTweets, function() {
					setTimeout(observe, sleepIntervalMili);
				});
			}
		});
	}
}

var updateDelivered = function(tweetsMap, cbFinished) {
	var keys = Object.keys(tweetsMap);
	var tasks = keys.length;
	
	if(!tasks) {
		cbFinished();
		return;
	}
	
	for(var i=0; i<keys.length; i++) {
		tweetModel.update({_id: keys[i]}, {delivered: true}, function (err, numberAffected, rawResponse) {
			--tasks;
			if(err) {
				console.error(err);
				return;
			}
			if(numberAffected != 1) {
				throw new Error("observerService#updateDelivered intends to update only one document at a time, but the updated were "
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