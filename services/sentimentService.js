var net = require('net'),
	SENTI_ENDPOINT = require('../cfg/serviceCfg').SENTI_ENDPOINT;

module.exports.evalText = evalText = function(data, callback) {

	if ('function' != typeof callback) {
		throw new TypeError('sentimentEval: callback is required');
	}

	var client = net.connect({ port: SENTI_ENDPOINT.server_port, host: SENTI_ENDPOINT.server_host }, function() {
		client.write('GET /' + encodeURIComponent(data) + '\r\n');
	});
	
	client.on('data', function(data) {
		var arr = String(data).split(" ");
		callback(null, { pos_sentiment: arr[0], neg_sentiment: arr[1], sentiment_polarity: arr[2] });
		client.end();
	});
	
	client.on('error', function(err) {
		callback(err)
	});
}