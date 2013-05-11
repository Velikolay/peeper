
/**
 * Module dependencies.
 */

var expressio = require('express.io')
	,routes = require('./routes')
	,http = require('http')
	,path = require('path')
	,mongoose = require('mongoose')
	,twitterAgent = require('./services/twitterAgent')
	,observerService = require('./services/observerService')
	,phrases = require('./routes/phrases')
	,search = require('./routes/search');

mongoose.connect("mongodb://localhost/dev");

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.info("DB connection successfull!");
	twitterAgent.init();
	observerService.start();
});

var app = expressio();
app.http().io();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(expressio.favicon());
  app.use(expressio.logger('dev'));
  app.use(expressio.bodyParser());
  app.use(expressio.methodOverride());
  app.use(app.router);
  app.use(expressio.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(expressio.errorHandler());
});

app.io.route('track', function(req) {
	trackList = req.data.trackList;
	for(var i=0; i<trackList.length; i++) {
		var phrase = trackList[i];
		console.log("Looking for " + phrase);
		observerService.notifyFor(phrase, function(data) {
			// store data in the user session in order to offload the observerService
			// from obsolate phrases when the user disconnects or no longer monitors them.
			console.log("new tweets received for " + phrase);
			req.io.emit('update', {phrase: phrase, data: data});
		});
	}
});
app.get('/', routes.index);
app.post('/phrases', phrases.track);
app.del('/phrases/:phrase', phrases.untrack);
app.get('/search', search.search);

app.listen(3000);
/*http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});*/
