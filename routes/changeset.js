var fs = require('fs')
    , levelup = require('levelup')
    , path = require('path')
    , sys = require('sys')
    , exec = require('child_process').exec;
    
/*
 * GET users listing.
 */

var db = levelup('./data/db');

exports.create = function(req, res) {
  var ChangesetId = 1;
  
  db.get('last_changeset_id', function (err, value) {
    if (err) {
      db.put('last_changeset_id', 999999);
      value = 999999;
    }
    ChangesetId = parseInt(value) + 1;
    db.put('last_changeset_id', ChangesetId);
    console.log("changeset: " + ChangesetId)
    res.send(ChangesetId.toString());
  })
};

exports.upload = function(req, res){
  var filename = './data/changeset-' + req.params.changeset_id + '.xml'
  var cmd = 'osmosis --read-xml-change file="' + filename + '" --sc --read-xml file="./data/map.osm" --apply-change --write-xml file="./data/map.osm"';
  fs.writeFile(filename, req.body, function (err) {
    exec(cmd, function (err, stdout, stderr) {
      console.log(err, stdout, stderr);
      res.send(200);
    })
  });
};

exports.close = function(req, res){
  res.send(200);
};