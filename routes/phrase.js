var twitterAgent = require('../services/twitterAgent')
	,Tweet = require('../models/tweet');

module.exports.track = function(req, res) {
	var phrase = req.body.phrase;
	if(!phrase) res.send(400, "Invalid phrase!");
	
	var accepted = twitterAgent.track(phrase, true);
	var location = '/phrases/' + encodeURIComponent(phrase)
	res.set('Location', location);
	if (accepted) {
		res.send(201, "Enabled monitoring of " + phrase);
	} else {
		res.send(301);
	}
}

module.exports.untrack = function(req, res) {
	var phrase = req.params.phrase;
	var accepted = twitterAgent.track(phrase, false);
	if(accepted) {
		res.send(200, "Dislabled monitoring of " + phrase);
	} else {
		res.send(404);
	}
}

module.exports.search = function (req, res) {
	var phrases = [];
	var phr = req.params.phrase;
	console.log(phr);
	if(phr) {
		phrases.push(phr);
	} else {
		phrases = req.query.filter.split(",");
	}
	// TODO add better validation
	var responseBody = [];
	var remainingTasks = phrases.length;
	for(var i = 0; i < phrases.length; i++) {
		Tweet.textSearch("\"" + phrases[i] + "\"", function (err, output) {
			remainingTasks--;
			if (err) {
				console.error(err);
				return;
			}
			responseBody.push(output);
			if(remainingTasks == 0) {
				res.send(200, responseBody);
			}
		});
	}
}