var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');


//Link to sql db
//use hash for protecting data
var User = db.Model.extend({
  tableName: 'users',
  //hasTimestamps: true,
  initialize: function(){
    this.on('creating', this.hashPassword);
  },
  comparePassword: function(attemptedPassword, callback){
    bcrypt.compare(attemptedPassword, this.get('password'), function(err, match){
      callback(match);
    });
  }, 
  hashPassword: function(){
    var cipher = Promise.promisify(bcrypt.hash);
    return cipher(this.get('password'), null, null)
            .bind(this)
            .then(function(hash){
              this.set('password', hash);
            }).then();
  }


 
  
  });



module.exports = User;