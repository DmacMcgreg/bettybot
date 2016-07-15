/**
 * Created by dave_ on 7/14/2016.
 */
'use strict';

var util    = require('util');
var path    = require('path');
var fs      = require('fs');
var mongodb = require('mongodb');
var SlackBot     = require('slackbots');

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env


var BettyBot = function Constructor(settings) {
	this.settings       = settings;
	this.settings.name  = this.settings.name || 'bettybot';
	this.dbPath         = settings.dbPath;

	this.user   = null;
	this.db     = null;

	var BBot = this;

};

// inherits methods and properties from the Bot constructor
util.inherits(BettyBot, SlackBot);

/**
 * Run the bot
 * @public
 * @type {Constructor}
 */

BettyBot.prototype.run = function() {
	console.log('Running Betty Bot');
	BettyBot.super_.call(this, this.settings);

	this.on('start', this._onStart);
	this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
BettyBot.prototype._onStart = function () {
	console.log('Starting up Betty Bot');
	var self = this;

	this._loadBotUser();
	this._connectDb(function(settings){
		self.db           = settings.db;
		self.responses    = settings.responses;
		self.info         = settings.info;
		self._firstRunCheck();
	});
};



/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
BettyBot.prototype._onMessage = function (message) {

	//if mentioning in channel
	if (this._isChatMessage(message) &&
		this._isChannelConversation(message) &&
		!this._isFromBettyBot(message) &&
		this._isMentioningBettyBot(message)
	) {
		this._replyWithResponse(message);

		//if mentioning in private chat
	} else if(this._isChatMessage(message) &&
		!this._isChannelConversation(message) &&
		!this._isFromBettyBot(message) &&
		this._isMentioningBettyBot(message)
	) {
		this._replyWithResponsePrivate(message);
	}
};




function getReply(originalMessage, self, callback){
	console.log('get reply');

	var rand = Math.random();

	var response = null;

	self.db.collection('responses').findOne(
		{
			random : { $gte : rand}
		},
		function(err, res){
			response = res
			if(response === null){
				self.db.collection('responses').findOne(
					{
						random : { $lte : rand}
					},
					function(err, res) {
						response = res;
						callback(response);
					}
				);
			} else{
				callback(response);
			}
		}
	);

}




/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
BettyBot.prototype._replyWithResponse = function (originalMessage) {
	var self = this;

	getReply(originalMessage, self, function(record){
		var channel = self._getChannelById(originalMessage.channel);
		self.postMessageToChannel(channel.name, record.text, {as_user: true});
	});
};



BettyBot.prototype._replyWithResponsePrivate = function (originalMessage) {
	var self = this;

	getReply(originalMessage, self, function(record){
		self.postMessage(originalMessage.user, record.text, {as_user: true});
	});

};




/**
 * Loads the user object representing the bot
 * @private
 */
BettyBot.prototype._loadBotUser = function () {
	var self    = this;

	this.user   = this.users.filter(function (user) {
		return user.name === self.name;
	})[0];
};

/**
 * Open connection to the db
 * @private
 */
BettyBot.prototype._connectDb = function (callback) {

	var self = this;
	return mongodb.MongoClient.connect(this.dbPath, function(err, db) {

			// Create seed data
			var seedData = [
				{
					id        : 1,
					text      : "Hey",
					used      : 0,
					random    : Math.random()
				},
				{
					id        : 2,
					text      : "Hello",
					used      : 0,
					random    : Math.random()
				}
			];

			db.collection('responses').findOne({id: 1}, function(err, res){
				if(res == null){
					db.collection('responses').insert(seedData, function(err, result){
						console.log('seeded data');
					});
				} else {
					console.log(res.text);
				}
			});


			var dbSettings = {
				db:             db,
				responses : 	db.collection('responses'),
				info:           db.collection('info')
			};
			callback(dbSettings);


	});

};

BettyBot.prototype.testsFailed = function () {
	var self = this;
	self.postMessageToGroup("unittest", "THE UNIT TESTS HAVE ALL FAILED. ITS ALL BORKED.", {as_user: true});

};



/**
 * Check if the first time the bot is run. It's used to send a welcome message into the channel
 * @private
 */
BettyBot.prototype._firstRunCheck = function () {
	var self = this;

	console.log('First Run Check');
	this.db.collection('info').findOne({id: 1}, function(err, res) {
		if(res == null){
			self._welcomeMessage();
			self.db.collection('info').insert({id: 1});
		}
	});

	var currentTime = (new Date()).toJSON();
};

/**
 * Sends a welcome message in the channel
 * @private
 */
BettyBot.prototype._welcomeMessage = function () {
	this.postMessageToChannel(this.channels[0].name, 'Good day Hooligans, ' +
		'\n I will be your wise guide to the TBSC world. Just say `betty` or ' + this.name + '` to invoke me!',
		{as_user: true});
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
BettyBot.prototype._isChatMessage = function (message) {
	return message.type === 'message' && Boolean(message.text);
};


/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
BettyBot.prototype._isChannelConversation = function (message) {
	return typeof message.channel === 'string' &&
		message.channel[0] === 'C';
};



/**
 * Util function to check if a given real time message is mentioning Betty or the bettybot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
BettyBot.prototype._isMentioningBettyBot = function (message) {
	return message.text.toLowerCase().indexOf('betty') > -1 ||
		message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if a given real time message has ben sent by the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
BettyBot.prototype._isFromBettyBot = function (message) {
	return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
BettyBot.prototype._getChannelById = function (channelId) {
	return this.channels.filter(function (item) {
		return item.id === channelId;
	})[0];
};





module.exports = BettyBot;