/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
// var colors = require('colors');
var ejs = require('ejs');

var CMS = require('easy-admin');

var Teams = require('./teams');
var TeamsController = Teams.Controller;
var Team = Teams.Model;

var Matches = require('./matches');
var MatchesController = Matches.Controller;
var Match = Matches.Model;

var Waterline = require('waterline');
var adapter = require('sails-disk');

// Setup Express
var app = express();
app.set('port', process.env.PORT || 3000);


// Tournament
var tournament = new CMS.Controller();

var teamsModel;
var teamsModelCollection;
var teamsController;

var matchesController;

function afterLoad(err, collection){
	// console.log(collection);
	teamsController = new CMS.ModelViewController({
		modelName: 'Team',
		listAttributes: ['id', 'country', 'name'],
		editAttributes: ['id', 'country', 'name'],
		model: collection
	});
	tournament.use(teamsController);

	matchesController = new MatchesController({
		teams: collection,
	});
	tournament.use(matchesController);

	// var countries = ['ad','ae','af','ag','ai','al','am','an','ao','aq','ar'];

	// for(var i = 0; i < 10; i++)
	// var i = 1;
		// collection.create({name: 'Team '+i, country: countries[i]}, function(err, model){
			// console.log(err);
		// });

	initCMS();
	
	// CMS.REST({
	// 	model: collection,
	// 	basePath: '/teste',
	// 	app: tournament,
	// });
}

function initCMS(){

	// Teams ModelViewController initialization

	// CMS initialization
	tournament.initialize({
		name: 'Tournament Manager',
		modelName: 'Team',
		app: app,
	});

	console.log(teamsModel)

	http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});
}


// Team Controller
// var teamsController = new TeamsController({ adapters: {default: adapter}, tableName: 'teams' });
// tournament.use(teamsController);

var teamsModel = new Team({ adapters: {default: adapter}, tableName: 'teams' }, afterLoad);

// var teamsController = new CMS.ModelViewController({modelName: 'Team'});
// tournament.use(teamsController);






