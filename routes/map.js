
/*
 * GET home page.
 */

exports.xml = function(req, res){
  res.set('Content-Type', 'text/xml');
  res.sendfile('./data/map.osm');
};