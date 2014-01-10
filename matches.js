/**
 * Module dependencies.
 */
var Waterline = require('waterline');
var _ = require('lodash');
var express = require('express');
var fs = require('fs');
var path = require('path');
var REST = require('easy-admin').REST;

/**
 * Expose 'TeamController' constructor
 */
module.exports.Controller = MatchesController;

/**
 * Expose 'Group' Model
 */
var Group = Waterline.Collection.extend({

	adapter: 'default',

	attributes: {
		// id: {type: 'int'},

		name: {
			type: 'string',
			defaultsTo: '[New Group]',
		},

		// Calculate scores
		table: calculateScoreTable

	},

});

/**
 * Expose 'Match' Model
 */
var Match = Waterline.Collection.extend({

	adapter: 'default',

	attributes: {
		// id: {type: 'int'},

		groupId: {
			type: 'string',
			required: true,
		},

		teamAId: {
			type: 'string',
			defaultsTo: null,
		},
		teamAScore: {
			type: 'integer',
			defaultsTo: 0,
		},
		teamBId: {
			type: 'string',
			defaultsTo: null,
		},
		teamBScore: {
			type: 'integer',
			defaultsTo: 0,
		},

		state: {
			type: 'string',
			defaultsTo: 'scheduled'
			// Can be one of: (scheduled|playing|ended)
		},

		day:  {
			type: 'integer',
			defaultsTo: '1',
		},
		hour:  {
			type: 'string',
			defaultsTo: '12:00',
		},
		field:  {
			type: 'string',
			defaultsTo: 'Ç',
		},
	}

});

// Method responsable for computing table data score
// (method inserted inside group model)
function calculateScoreTable(){
	// console.log(this);
	/*return [
		{team: 13, P: 0, S: 0, W: 0, D: 0, L: 0, score: 0},
		{team: 16, P: 0, S: 0, W: 0, D: 0, L: 0, score: 0}
	];*/

	// Compute team Wins, Losts, Draws and Goal-Sum
	/*
		// Uses the key as the teamId
		{
			     1: {P: x, S: y, [...]},
		 	teamId: {P: x, S: y, [...]}
		 }
	*/
	var rawTable = {};
	var _default = {rank: 0, teamId: 0, P: 0, goalsMade: 0, goalsTaken: 0, S: 0, W: 0, D: 0, L: 0, score: 0};

	for(var k in this.matches){
		var match = this.matches[k];

		// Compute game points for both teams
		computeGame(match, match.teamAId, match.teamAScore, match.teamBScore);
		computeGame(match, match.teamBId, match.teamBScore, match.teamAScore);
	}

	// Adds game to the teamId. Should be runned twice for each
	// side of match (teamA and teamB).
	function computeGame(match, teamId, goalsMade, goalsTaken){
		// Skip empty id's
		if(!teamId)
			return;

		// Generate default template if NOT in array yet
		if(!rawTable[teamId]){
			var teamRow = _.clone(_default);
			// Keeps team id under team
			teamRow.teamId = teamId;
			// Inserts team in rawTable
			rawTable[teamId] = teamRow;
		}

		// Get teamRow (it is supposed to exist)
		var teamRow = rawTable[teamId];

		// Compute points ONLY if match is not 'scheduled'
		// logycaly, it's 'ended' or 'playing', so we compute it
		if(match.state == 'scheduled')
			return;

		// Increment Plays 
		teamRow.P++;

		// Compute goals made/taken
		teamRow.goalsMade += goalsMade*1;
		teamRow.goalsTaken += goalsTaken*1;

		// Win
		if(goalsMade > goalsTaken)
			teamRow.W ++;
		// Loose
		else if(goalsMade < goalsTaken)
			teamRow.L ++;
		// Drew
		else
			teamRow.D ++;
	}

	// Compute 'final score' and add column S (goalsMade:goalsTaken)
	// Transfer data to final table array
	var finalTable = [];
	_.forEach(rawTable, function(row){
		row.score = row.W*3 + row.D*1;
		row.S = row.goalsMade*1 + ':' + row.goalsTaken*1;

		finalTable.push(row);
	});

	// Sort by 'score' field
	finalTable = _.sortBy(finalTable, 'score').reverse();

	// Rank Table
	var pos = 0;
	var lastScore = -1;

	_.forEach(finalTable, function(row){
		// Keeps the same ranking if scores is the same
		if(lastScore != row.score){
			pos++;
			lastScore = row.score;
		}

		row.rank = pos;
	});


	return finalTable;

}

module.exports.Group = Group;
module.exports.Match = Match;

// Helper methods
function findAssociated(Model, key, id, cb){
	// Create where clause
	var options = {
		where: {}
	};
	options.where[key] = id;

	var finding = Model.find(options);

	finding.done(function afterFound(err, models) {
		if(cb)
			cb(models);
	});
}

/**
 * TeamController Module Controller
 */
function MatchesController(options){

	// Global access to self class
	var self = this;

	self._defaults = {
		teams: null,
		groups: null,
		matches: null,
	};

	// Setup default options
	for(k in self._defaults)
		self[k] = self._defaults[k];

	// Set options
	for(k in options)
		self[k] = options[k];

	
	// Data about this Object
	this.name = 'Matches Controller';
	this.desc = 'Manage groups and matches';
	this.version = '1.0.0';

	// CMS app instance
	this.cms = null;

	// REST API instances
	this.rest = {
	}

	/**
	 * Initialize module with the given TournamentController
	 */
	this.initialize = function(cms){
		self.cms = cms;

		self.cms.app.use(express.static(path.join(__dirname, './public')));

		self.cms.route(self.routes);
		self.cms.addMenus(self.menuItems);

		// Initialize REST API for Models
		self.rest.teams = new REST({
			model: self.teams,
			basePath: '/groups/teams',
			app: cms,
		});

		self.rest.groups = new REST({
			model: self.groups,
			basePath: '/groups',
			app: cms,
		});

		self.rest.matches = new REST({
			model: self.matches,
			basePath: '/groups/matches',
			app: cms,
		});

		// findAssociated(self.matches, 'groupId', '32', function(data){
		// 	console.log(data);
		// });
	};
	
	/*************************************************
	 					Models
	 *************************************************/

	/*************************************************
	 					Views
	 *************************************************/

	// Cached menuItems
	this.menuItems = [
		{name: 'Groups', path: '/groups'}
	];

	
	this.sideMenu = [
	];

	this.manage = function(req, res){
		var data = {
			title: 'Manage Groups',
			sideMenu: false
		};

		self.cms.renderWithView(res, __dirname+'/public/manage.ejs', data);
	}

	this.teamlist = function(req, res){

		self.teams.find(afterFind);

		function afterFind(err, data){
			var teamList = [];
			var query = (req.param('query') || '').toLowerCase();

			for(k in data){
				team = data[k]
				var insert = 
				{
					id: team.id,
					text: data[k].name
				};

				if((insert.text || '').toLowerCase().indexOf(query) >= 0)
					teamList.push(insert);
			}

			res.send(teamList);
		}
	}

	// Mix in matches inside groups data
	this.associated = function(req, res, next){

		// Search for ID if requested
		options = {where: {}};
		var id = req.param('id');
		if(id) options.where.id = id;


		var finding = self.groups.find(options);

		finding.done(function afterFound(err, models) {
			if(!err)
				afterFindGroups(models);
		});

		// Data to be rendered
		var data = [];
		// Wait for parallel tasks to complete
		var completed = 0;

		// After finishing search
		function afterFindGroups(models){
			data = models;
			completed = 0;
			
			if(data.length <= 0)
				return finishRendering();

			// Load Matches for each Group and associates
			data.forEach(function(group){

				findAssociated(self.matches, 'groupId', group.id, function(matches){
					// Associate matches with groups
					group.matches = matches;

					// Compute scoring table for each group
					// (must be computed AFTER associating matches with it)
					group.table = group.table();

					// Callback
					loadedModel();
				});
			});
		}

		// Function needed to wait for all queries to finish
		function loadedModel(){
			completed++;

			if(completed >= data.length)
				associateTeams();
		}

		// Load Teams
		function associateTeams(){
			self.teams.find(afterFindTeams);
		}

		// Associate keys with teams
		function afterFindTeams(err, teamData){
			var teamList = {};

			// Load teams and assing it's key as it's id
			teamData.forEach(function(team){
				teamList[team.id] = team;
			});

			// Includes team object in 'table' data
			data.forEach(function(group){

				// console.log(group);
				// Go trough all the table adding key 'team' with team data
				_.forEach(group.table, function(row){
					row.team = teamList[row.teamId];
				});
			});

			// Includes team object in 'match' data
			data.forEach(function(group){

				// console.log(group);
				// Go trough all the table adding key 'team' with team data
				_.forEach(group.matches, function(row){
					row.teamA = teamList[row.teamAId];
					row.teamB = teamList[row.teamBId];
				});
			});

			// console.log(data);
			finishRendering();
		}

		// Render JSON content
		function finishRendering(){
			// If none object found with given id return error
			if(id && !data[0])
				return next();

			// If querying for id, then returns only the object
			if(id)
				data = data[0];

			// Render the json
			res.send(data);
		}
	}

	// Routes
	this.routes = [
		{path: '/groups', callback: self.manage},

		{path: '/groups/teamlist', callback: self.teamlist},

		{path: '/groups/associated/:id?', callback: self.associated}
	];


}