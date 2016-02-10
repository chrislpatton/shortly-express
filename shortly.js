var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var bcrypt = require('bcrypt-nodejs');

var app = express();
//Added to require session
var session = require('express-session');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

//router
//rendering index
//START SESSION
app.use(session({secret: 'sprint123', 
                 resave: true,
                 saveUninitialized: true
               }));

// function restrict(req,res, next){
//   if (req.session.user){
//     next();
//   } else {
//     req.session.error = 'Please Login';
//     res.redirect('/login');
//   }
// }

app.get('/', util.checkUser, function(req, res ) {
  res.render('index');
  //restrict();
  //Pass in login information
  //helper functions needed:
    //isLoggedIn
    // if(req.session && req.session.user){
    //   //Boolean(req.session.user)

    // } else {

    // }
  //Check session to see if exising session (ie - a person logged in)
    //if so, redirect to main page
    /*if(!req.session.isLoggedIn) {
        res.redirect('/login')
      } else {
        res.render('/index')
      }
      */
  //req.session()
});

//Shortens URL and puts it into index list - where is logic?
app.get('/create', util.checkUser, function(req, res) {
  res.render('index');
});

//fetches data out of database
app.get('/links', util.checkUser, function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

//post information to database
app.post('/links', util.checkUser, function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });
        //saves this info to database
        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
//TODO
//1. Revisit B-Crypt
//2. Compare function will be here somewhere
// Start with log-in or sign-up
//3. Writing routes/check specs
//4. Save to Database on sign-up
//Get to authenticate user and password


//Sign up route:
//Get renders Page
app.get('/signup', function(req, res) {
  res.render('signup');
});

//POST for Signup
//input username and password
app.post('/signup', 
  function(req, res){
    var username = req.body.username;
    var password = req.body.password; 
    new User({username: username}).fetch().then(function(user){
      //if unique username, create new user and password
      if(!user){
       var newUser = new User({
          username: username, 
          password: password
        });
       
        
       // // bcrypt.hash(password, null, null, function(err, hash){
       // //  //create user and put in table via bookshelf method
       // //  User.set({password: hash}).then(function(user){
       // //    util.createSession(req, res, user);
       // //  });
       // // });

       //saves this info to database
        newUser.save().then(function(savedUser) {
          Users.add(savedUser);
          //res.send(200, savedUser);
          //res.redirect('/login');
          util.createSession(req, res, savedUser);
       }); 


      } else {
        //show error
        res.redirect('/signup');
        console.log('Account already exists!  Try again!');
      }

  });
});


//Login Route

    //within login page - have logic to sign up  
    //if not, redirect to signup page
  //compare password SOMEWHERE
app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  
  //promises, simplify callbacks
  var user = new User({username: username}).fetch().then(function(user){
    if (!user){
      res.redirect('/login');
    } 
   // bcrypt.compare(password, user.get('password'), function(err, match){
      user.comparePassword(password, function(match) {
        if (match){
          util.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
    });

  });

});

  //validate username and password, if don't exist, redirect to sign in

//Logout Route - no template, may need to refactor after
//logout - return to index page + destroys session
app.get('/logout', 
function(req, res) {
  req.session.destroy(function(){
    res.redirect('/');
  });
});



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
