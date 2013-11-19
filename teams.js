/**
 * Module dependencies.
 */
var _ = require('lodash');
var Team = require('./team');

/**
 * Expose 'TeamController' constructor
 */
module.exports = TeamController;


/**
 * TeamController Module constructor
 */
function TeamController(modelConfig){

	// Global access to self class
	var self = this;
	
	// Data about this Object
	this.name = 'Teams Controller';
	this.desc = 'Manages teams';
	this.version = '1.0.0';

	// CMS app instance
	this.cms = null;

	/**
	 * Initialize module with the given TournamentController
	 */
	this.initialize = function(cms){
		self.cms = cms;

		self.cms.route(self.routes);
		self.cms.addMenus(self.menuItems);

		self._teams = new Team(modelConfig, self.onLoad);
	};
	
	/*************************************************
	 				Teams Model
	 *************************************************/
	// Team model
	this._teams = null

	// Collection
	this.teams = null;

	this.onLoad = function(err, collection){
		if(err){
			console.log('Failed to Initialized Team model'.red);
			console.log(err);
			return;
		}

		console.log('Initialized Team model'.green);

		self.teams = collection;

		self.afterRefresh();
	}

	// Helper method to simplify things
	this.getTeams = function(cb){
		self.teams.find().exec(function(err, data){
			if(err)
				return;

			cb(data);
		});
	}


	/*************************************************
 				Assync callback methods
	 *************************************************/	
	this.afterRefresh = function(){
		// Refresh badge to show current teams number
		self.teams.count().exec(function(err, count){
			self.viewMenu.badge = count;
			self.menuItems[0].badge = count;
		});
	}

	/*************************************************
	 				Teams Views
	 *************************************************/

	// Cached menuItems
	this.menuItems = [
		{name: 'Teams', path: '/teams', badge: '19'}
	];

	this.viewMenu = {
		name: 'List Teams',
		path: '/teams',
		badge: '-',
		icon: 'list'
	}

	this.createMenu  = {
		name: 'Create Team',
		path: '/teams/create',
		icon: 'plus'
	}

	this.sideMenu = [
		this.viewMenu,
		this.createMenu,
	];

	this.list = function(req, res){

		var data = {
			title: 'List Teams',
			sideMenu: self.sideMenu,
			pathname: '/teams',

			teams: self.teams
		};

		self.getTeams(onData);

		function onData(teams){
			data.teams = teams;
			finishRender();
		}

		function finishRender(){
			self.cms.renderWithView(res, __dirname+'/list_teams.ejs', data);
		}
	}

	this.create = function(req, res){
		var data = {
			title: 'Create Team',
			sideMenu: self.sideMenu,

			teams: null,
			teamModel: [
				'name', 'id', 'country', 'state'
			]
		};

		self.cms.renderWithView(res, __dirname+'/list_teams.ejs', data);
	}

	this.edit = function(req, res){
		var data = {
			title: 'Edit Team',
			sideMenu: self.sideMenu,

			teams: null,
			teamModel: [
				'name', 'id', 'country', 'state'
			]
		};

		self.cms.renderWithView(res, __dirname+'/list_teams.ejs', data);
	}

	this.remove = function(req, res){
		var data = {
			title: 'Remove Team',
			sideMenu: self.sideMenu,
			// pathname: '/teams/create',

			teams: null,
			teamModel: [
				'name', 'id', 'country', 'state'
			]
		};

		// self.cms.renderWithView(res, __dirname+'/list_teams.ejs', data);

		self.teams.destroy({id: req.param('id')}, function(err){

			if(err) return res.json({ err: err }, 500);
		    res.json({ status: 'ok' });

			// self.cms.redirect(res, '/teams');
			self.afterRefresh();
		});

	}

	// Routes
	this.routes = [
		{path: '/teams', callback: self.list},
		{path: '/teams/create', callback: self.create},
		{path: '/teams/edit/:id', callback: self.edit},
		{path: '/teams/delete/:id', callback: self.remove, method: 'del'},
	];


}