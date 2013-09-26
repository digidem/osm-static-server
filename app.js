
/**
 * Module dependencies.
 */

var express = require('express')
  , map = require('./routes/map')
  , changeset = require('./routes/changeset')
  , xmlparse = require('./middleware/xmlparse')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

/**
 * CORS support.
 */

app.all('*', function(req, res, next){
  if (!req.get('Origin')) return next();
  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', 'http://localhost:8000');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  // res.set('Access-Control-Allow-Max-Age', 3600);
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/api/0.6/map', map.xml);
app.get('/api/capabilities', function (req, res) { res.send(200) })
app.put('/api/0.6/changeset/create', changeset.create);
app.post('/api/0.6/changeset/:changeset_id/upload', xmlparse(), changeset.upload);
app.put('/api/0.6/changeset/:changeset_id/close', changeset.close);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
