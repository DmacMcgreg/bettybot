var express = require('express');
var mongodb = require('mongodb');
var app = express();

var user = process.env.USER || 'dave';
var pass = process.env.PASS || 'testingbot';
var host = process.env.HOST || 'ds021943.mlab.com';
var port = process.env.PORT || 21943;
var db   = process.env.DB   || 'bots';

var uri = 'mongodb://'+user+':'+pass+'@'+host+':'+port+'/'+ db;

app.use(express.static('public'));

app.get("/", function (request, response) {
  response.send("Welcome");
});

app.get("/failure", function (request, response) {
  bettybot.testsFailed();
  response.sendStatus(200);
});

// listen for requests :)
var listener = app.listen(3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});


var BettyBot = require('./lib/bettybot');

var token       = 'xoxb-58723692388-91JsxHERwPECDHXsGudNn9Io';
var dbPath      = uri;
var name        = "bettybot";

var bettybot = new BettyBot({
  token   : token,
  dbPath  : uri,
  name    : name
});

bettybot.run();