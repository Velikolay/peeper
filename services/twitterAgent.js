var twitter = require('ntwitter'),
	tweetModel = require('../models/tweetModel'),
	phraseModel = require('../models/phraseModel'),
	sentiment = require('./sentimentService'),
	TWITTER_CREDENETIALS = require('../cfg/serviceCfg').TWITTER_CREDENETIALS;

var ntwitter = new twitter({
		consumer_key: TWITTER_CREDENETIALS.consumer_key,
		consumer_secret: TWITTER_CREDENETIALS.consumer_secret,
		access_token_key: TWITTER_CREDENETIALS.access_token_key,
		access_token_secret: TWITTER_CREDENETIALS.access_token_secret
});

module.exports.init = function() {
	phraseModel.find({}, 'text', function(err, data) {
		if(err) {
			console.error(err);
			process.exit(1);
		}
		if(data.length == 0) {
			console.info("Nothing to be tracked");
			return;
		}
		
		var trackList = function(data) {
			var trackList=[];
			for(var i=0; i<data.length; i++) {
				trackList.push(data[i].text);
			}
			return trackList;
		}
		
		track(trackList(data));
	});
}

module.exports.track = track = function(trackList) {
	console.info("Refreshing the track list! The list contains: " + trackList);
	ntwitter.stream('statuses/filter', { 'track': trackList, 'filter_level': 'low', 'language': 'en' }, function(stream) {
		
		if(trackList.length == 0) {
			// TODO it doesn`t seem to work :( I guess the damn API doesn`t fire the 'end' event.
			console.log("destroying stream");
			stream.destroy();
		}
		
		stream.on('data', function (data) {
			if (typeof data.id == 'undefined') {
				console.log("undefined data recieved");
				return;
			}
			
			sentiment.evalText(data.text, function (err, res) {
				var obj = { _id: data.id, text: data.text, user: data.user.screen_name, created_at: data.created_at, sentiment: {}, profile_image_url:data.user.profile_image_url };
				
				if(err) {
					console.error(err);
				} else {
					obj.sentiment.positive = res.positive;
					obj.sentiment.negative = res.negative;
					obj.sentiment.polarity = res.polarity;
				}
				var tweet = new tweetModel(obj);
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
			console.log(response);
		});
		
		stream.on('destroy', function (response) {
			// Handle a 'silent' disconnection from Twitter, no end/error event fired
			console.log(response);
		});
	});
}