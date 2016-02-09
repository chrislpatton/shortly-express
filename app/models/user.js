var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

//Link to sql db
//use hash for protecting data
var User = db.Model.extend({
  //tablename: 
  
});

module.exports = User;