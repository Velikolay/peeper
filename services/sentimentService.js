var net = require('net'),
	SENTI_ENDPOINT = require('../cfg/serviceCfg').SENTI_ENDPOINT;

module.exports.start = function() {
	// TODO implement start function
}

module.exports.healthcheck = function() {
}

module.exports.evalText = function(data, callback) {
	
	if ('function' != typeof callback) {
		throw new TypeError('sentimentEval: callback is required');
	}
	
	var client = net.connect({ port: SENTI_ENDPOINT.server_port, host: SENTI_ENDPOINT.server_host }, function() {
		client.write('GET /' + encodeURIComponent(data) + '\r\n');
	});
	
	client.on('data', function(data) {
		var arr = String(data).split(" ");
		callback(null, { positive: arr[0], negative: arr[1], polarity: arr[2] });
		client.end();
	});
	
	client.on('error', function(err) {
		callback(err)
	});
}