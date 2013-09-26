
/*!
 * Connect - json
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('connect/lib/utils')
  , _limit = require('connect/lib/middleware/limit')
  , XmlStream = require('xml-stream')
  , levelup = require('levelup');

/**
 * noop middleware.
 */

function noop(req, res, next) {
  next();
}

/**
 * JSON:
 *
 * Parse JSON request bodies, providing the
 * parsed object as `req.body`.
 *
 * Options:
 *
 *   - `strict`  when `false` anything `JSON.parse()` accepts will be parsed
 *   - `reviver`  used as the second "reviver" argument for JSON.parse
 *   - `limit`  byte limit disabled by default
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

exports = module.exports = function(options){
  var options = options || {}
    , strict = options.strict !== false;

  var limit = options.limit
    ? _limit(options.limit)
    : noop;

  var db = levelup('./data/id_db');

  var nextNodeId
    , nextWayId;
  var idMap = {};
  
  db.get('last_node_id', function (err, value) {
    if (err) {
      console.log(err);
      db.put('last_node_id', 9999999999);
      value = 9999999999;
    }
    nextNodeId = parseInt(value) + 1;
    console.log("next nid: ", value);
  });
  
  db.get('last_way_id', function (err, value) {
    if (err) {
      db.put('last_way_id', 9999999999);
      value = 9999999999;
    }
    nextWayId = parseInt(value) + 1;
  });
  
  return function xmlparse(req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};

    if (!utils.hasBody(req)) return next();

    // check Content-Type
    if ('text/xml' != utils.mime(req)) return next();

    // flag as parsed
    req._body = true;

    // parse
    limit(req, res, function(err){
      if (err) return next(err);
      var buf = '';
      req.setEncoding('utf8');
      
      req.setEncoding('utf8');
      var xml = new XmlStream(req);
      
      xml.collect('nd');
      
      xml.on('startElement: node', function(node) {
        node.$['timestamp'] = "2013-09-05T19:38:11.187Z";
        node.$.version = (parseInt(node.$.version) + 1).toString();
      });
      
      xml.on('startElement: create node', function(node) {
        idMap[node.$.id] = nextNodeId.toString()
        node.$.id = idMap[node.$.id];
        nextNodeId += 1;
      });
      
      xml.on('startElement: create way', function(way) {
        console.log("wid: ",way.$.id);
        way.$.id = nextWayId.toString();
        nextWayId += 1;
      });
      
      xml.on('updateElement: way', function(way) {
        way.$['timestamp'] = "2013-09-05T19:38:11.187Z";
        way.$.version = (parseInt(way.$.version) + 1).toString();
        for (var i = 0; i < way.nd.length; i++) {
          var ref = way.nd[i].$.ref;
          if (parseInt(ref) < 0) way.nd[i].$.ref = idMap[ref];
        }
      });
      
      xml.on('data', function(chunk){ buf += chunk; });
      xml.on('end', function(){
        var first = buf.trim()[0];
        db.put('last_node_id', nextNodeId - 1);
        db.put('last_way_id', nextWayId - 1);

        if (0 == buf.length) {
          return next(400, 'invalid xml, empty body');
        }
        
        try {
          req.body = buf;
          next();
        } catch (err){
          err.body = buf;
          err.status = 400;
          next(err);
        }
      });
    });
  }
};
