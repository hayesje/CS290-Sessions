var express = require('express');
var request = require('request');
var credentials = require('./credentials.js');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var session = require('express-session');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session( { secret: credentials.secret }));
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);

app.get('/', function(req,res) {
   var context = {};
   if(!req.session.name){
     res.render('name', context);
     return;
   }
   req.session.curId += 1;
   context.times = req.session.curId;
   context.user = req.session.name;
   res.render('home', context);
});

app.post('/name', function(req, res, next) {
  if(req.body['New Name']){
    req.session.name = req.body.name;
    req.session.curId = 0;
  }
  res.redirect('/');
});

app.get('/weather', function(req,res,next) {
  var service_results;
  var owm_base_url = "http://api.openweathermap.org/data/2.5/weather?";
  var owm_end_url  = ",us&units=imperial&appid=" + credentials.owmKey;
  if(req.query.q) {
     var owm_query_type = "q=" + req.query.q;
  } else {
     var owm_query_type = "zip=" + req.query.zip; 
  }
  var query = owm_base_url + owm_query_type + owm_end_url;
  request(query, OpenWeatherMap);

  function OpenWeatherMap(error, response, body) {
    if(!error && response.statusCode < 400) {
        service_results = JSON.parse(body);
        if (typeof(service_results.coord) != "undefined") {
          var gtz_base_url = "https://maps.googleapis.com/maps/api/timezone/json?location=";
          var gtz = gtz_base_url + service_results.coord.lat + "," + service_results.coord.lon;
          gtz = gtz + "&timestamp=0&key=" + credentials.gtzKey;
          request({"url":gtz, "method":"GET"}, googleTimeZone);
        }
        else {
          res.send(service_results);
        }
     } else {
       if(response) {
          console.log(response.statusCode);
       } 
       res.send('{}');
     }
   }
   
   function googleTimeZone(error, response, body) {
      if(!error && response.statusCode < 400) {
         var timezone = JSON.parse(body);
         service_results.dstOffset = timezone.dstOffset;
         service_results.rawOffset = timezone.rawOffset;
         res.send(JSON.stringify(service_results));
       } else {
         res.send(JSON.stringify(service_results));
       }
    }
});


app.use(function(req,res) {
  res.status(404);
  res.render('404');
});

app.use(function(err,req,res,next) {
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function() {
   console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
