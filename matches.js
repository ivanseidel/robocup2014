/**
 * Module dependencies.
 */
var Waterline = require('waterline');
var _ = require('lodash');
var express = require('express');
var fs = require('fs');
var path = require('path');

/**
 * Expose 'TeamController' constructor
 */
module.exports.Controller = MatchesController;

/**
 * Expose 'Team' Model
 */
var Group = Waterline.Collection.extend({

	adapter: 'default',

	attributes: {
		id: {type: 'int'},

		name: 'string',

		matches: 'array',
	}

});

module.exports.Group = Group;

/**
 * TeamController Module Controller
 */
function MatchesController(options){

	// Global access to self class
	var self = this;

	self._defaults = {
		teams: false,
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

	/**
	 * Initialize module with the given TournamentController
	 */
	this.initialize = function(cms){
		self.cms = cms;

		self.cms.app.use(express.static(path.join(__dirname, './public')));

		self.cms.route(self.routes);
		self.cms.addMenus(self.menuItems);
	};
	
	/*************************************************
	 					Models
	 *************************************************/
	// Groups model
	this._groups = null

	// Collection
	this.groups = null;

	// this.onLoad = function(err, collection){
	// 	if(err){
	// 		console.log('Failed to Initialized Groups model'.red);
	// 		console.log(err);
	// 		return;
	// 	}

	// 	console.log('Initialized Groups model'.green);

	// 	self.groups = collection;

	// 	self.afterRefresh();
	// }

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
			sideMenu: null
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
					text: '('+team.id + ') '+data[k].name
				};

				if(insert.text.toLowerCase().indexOf(query) >= 0)
					teamList.push(insert);
			}

			res.send(teamList);
		}
	}

	// Routes
	this.routes = [
		{path: '/groups', callback: self.manage},

		{path: '/groups/teamlist', callback: self.teamlist}
	];


}