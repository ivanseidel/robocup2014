/**
 * Module dependencies.
 */
var Waterline = require('waterline');

/**
 * Expose 'Team' constructor
 */
module.exports = Waterline.Collection.extend({

	adapter: 'default',

	attributes: {
		id: {type: 'string'},

		name: 'string',
		category: 'string',

		country: 'string',
		state: 'string',
		city: 'string',

		active: 'boolean',
	}

});