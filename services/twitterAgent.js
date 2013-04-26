var twitter = require('ntwitter'),
	Tweet = require('../models/tweet'),
	sentiment = require('./sentimentService'),
	TWITTER_CREDENETIALS = require('../cfg/serviceCfg').TWITTER_CREDENETIALS;

module.exports = new function() {
	this.ntwitter = new twitter({
		consumer_key: TWITTER_CREDENETIALS.consumer_key,
		consumer_secret: TWITTER_CREDENETIALS.consumer_secret,
		access_token_key: TWITTER_CREDENETIALS.access_token_key,
		access_token_secret: TWITTER_CREDENETIALS.access_token_secret
	});
	this.trackList = [];

	this.track = function(keyPhrase, enable) {
		var index = this.trackList.indexOf(keyPhrase);
		if(enable && index==-1) {
			this.trackList.push(keyPhrase);
		} else if(!enable && index!=-1) {
			this.trackList.splice(index, 1);
		} else {
			return false;
		}
		var listLen = this.trackList.length;
		console.log("Refreshing the track list! The new list contains " + listLen + " phrases " + this.trackList);
		this.ntwitter.stream('statuses/filter', { 'track': this.trackList, 'filter_level': 'medium', 'language': 'en' }, function(stream) {
		
			if(listLen == 0) {
				// TODO it doesn seem to work? :(
				stream.destroy();
			}

			stream.on('data', function (data) {
				if (typeof data.id == 'undefined') {
					console.log("undefined data recieved");
					return;
				}
				
				sentiment.evalText(data.text, function (err, res) {
				
					var obj = { _id: data.id, text: data.text, user: data.user.screen_name, created_at: data.created_at };
					
					if(err) {
						console.error(err);
					} else {
						obj.pos_sentiment = res.pos_sentiment;
						obj.neg_sentiment = res.neg_sentiment;
						obj.sentiment_polarity = res.sentiment_polarity;
					}
					var tweet = new Tweet(obj);
					tweet.save(function (err) {
	  					if (err) console.error(err);
	  					console.log(tweet);
					});
				});
			});

			stream.on('error', function (error) {
				console.log(error);
			});
			
			stream.on('end', function (response) {
				// Handle a disconnection
			});

			stream.on('destroy', function (response) {
				// Handle a 'silent' disconnection from Twitter, no end/error event fired
			});
		});
		return true;
	}
}