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
app.use(session({secret: 'sprint123'}));


app.get('/', 
function(req, res) {
  //Pass in login information
  //helper functions needed:
    //isLoggedIn
    //

  //Check session to see if exising session (ie - a person logged in)
    //if so, redirect to main page
    /*if(!req.session.isLoggedIn) {
        res.redirect('/login')
      } else {
        res.render('/index')
      }
      */
  

  //req.session()
  res.render('index');

});

app.get('/create', 
function(req, res) {
  res.render('index');
});

//fetches data out of database
app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

//post information to database
app.post('/links', 
function(req, res) {
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
//Sign up route:
app.get('/signup', 
function(req, res) {
  res.render('signup');
});


//Login Route

    //within login page - have logic to sign up  
    //if not, redirect to signup page
  
app.get('/login', 
function(req, res) {
  //.get + .post
  //renders page
  
  //if (!signedup){
      //res.redirect('signup');
    //} else {
      //res.render('login');
    //}
//app.post('/login'){
  //validate username and password, if don't exist, redirect to sign in
//}

});

//Logout Route - no template, may need to refactor after
//logout - return to index page + destroys session
// app.get('/logout'), 
// function(req, res) {
//   res.render('logout');
// });


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
