/**
 * Created by dave_ on 7/14/2016.
 */

var BettyBot = require('../lib/bettybot');

var token       = process.env.BOT_API_KEY || 'xoxb-58723692388-aPj8d1RjDAnkuARevCM8ueBa';
var dbPath      = process.env.BOT_DB_PATH;
var name        = process.env.BOT_NAME;

var bettybot = new BettyBot({
	token   : token,
	dbPath  : dbPath,
	name    : name
});

bettybot.run();

const app = require('express')();
app.get('/', function(req, res) {
	res.send('Welcome');
});
app.listen();