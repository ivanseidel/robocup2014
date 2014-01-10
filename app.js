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

var Matches = require('./matches');
var MatchesController = Matches.Controller;

var Waterline = require('waterline');
var adapter = require('sails-disk');
// var adapter = require('sails-disk');

// Setup Express
var app = express();
app.set('port', process.env.PORT || 3000);


// Tournament
var tournament = new CMS.Controller();

var teamsModel;
var teamsModelCollection;
var teamsController;

var matchesController;


var models = {
	teams: null,
	groups: null,
	matches: null,
};

// Helper used to save the loaded model and go to next action
function saveModel(model, next){
	return function(err, collection){
		if(err){
			console.log('FAILED TO LOAD MODEL '.red + model.cyan);
		}else{
			console.log('MODEL LOADED: '.green + model.cyan);
			models[model] = collection;
		}

		next();
	}
}

function startLoading(){
	console.log('START LOADING MODELS...'.green);
	loadTeams();
}

function loadTeams(){
	// Loads Teams
	var Team = Teams.Model;
	models.teams = new Team({ adapters: {default: adapter}, tableName: 'teams' }, saveModel('teams', loadGroups));
}

function loadGroups(){
	// Loads Group 
	var Group = Matches.Group;
	models.groups = new Group({ adapters: {default: adapter}, tableName: 'groups' }, saveModel('groups', loadMatches));
}

function loadMatches(){
	// Loads Matches
	var Match = Matches.Match;
	models.matches = new Match({ adapters: {default: adapter}, tableName: 'matches' }, saveModel('matches', finishLoading));
}

function finishLoading(){
	console.log('FINISHED MODEL LOADING'.green);

	loadCMS();
}

function loadCMS(){
	teamsController = new CMS.ModelViewController({
		modelName: 'Team',
		listAttributes: ['id', 'country', 'name'],
		editAttributes: ['id', 'country', 'name'],
		model: models.teams
	});
	tournament.use(teamsController);

	matchesController = new MatchesController({
		teams: models.teams,
		groups: models.groups,
		matches: models.matches,
	});
	tournament.use(matchesController);

	// var countries = ['ad','ae','af','ag','ai','al','am','an','ao','aq','ar'];

	// for(var i = 0; i < 10; i++)
	// var i = 1;
		// collection.create({name: 'Team '+i, country: countries[i]}, function(err, model){
			// console.log(err);
		// });


	// Teams ModelViewController initialization

	// CMS initialization
	tournament.initialize({
		name: 'Tournament Manager',
		app: app,
	});

	http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port '.cyan + app.get('port'));
	});
}
startLoading();





