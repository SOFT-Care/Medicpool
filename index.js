'use strict';

require('dotenv').config();
let PORT = process.env.PORT;
let express = require('express');
let path = require('path');
let app = express();
let superagent = require('superagent');
let cors = require('cors');
var $ = require('jquery');
var bodyParser = require('body-parser');
let methodOverride = require('method-override');

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cors());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/jquery', express.static(path.join(__dirname + '/node_modules/jquery/dist/')));
app.use(express.static(path.join(__dirname, 'data')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(exppress.urlencoded({
  extended: true
}));

// Get requests
app.get('/', getHomePage);
app.get('/covid19', getCovid19);
app.get('/corona/search', getSearchCorona);
app.get('/signup', getSignUpPage);
app.get('/searches/find', showForm); // Shows the form of search
app.post('/searches', createSearch); // Renders the result of the search


function getHomePage(req, res) {
  res.render('pages/index');
}


function showForm(request, response) {
    response.render('pages/searches/find');
}

function getCovid19(req, res) {
  res.render('pages/corona-page/search')
}

function getSearchCorona(req, res) {
  let param = req.query.country;
  console.log(param);
  superagent.get(`https://api.covid19api.com/total/dayone/country/${param}`).then(retData => {
    res.send(retData.body)
  });
}

function createSearch(req, res) {
    // console.log(req.body);
    let location = req.body.location;

    let key = process.env.GOOGLE_AUTH;
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=clinic&key=${key}&region=${location}`;

    superagent.get(url)
        .then(apiResponse => {
            return apiResponse.body.results.map(doctorResult => new Doctor(doctorResult))
        })
    .then((results) => {
      console.log(results);
      res.render('pages/searches/results', { searchResults: results })
    })
}


function Doctor(info) {
    this.name = info.name;
    this.speciallity = info.business_status;
    this.location = info.formatted_address;
    this.availibility = info.opening_hours ? info.opening_hours.open_now : "NOT AVAILABLE";
}


function getSignUpPage(req, res) {
  res.render('pages/signuppage/signup');
}

app.get('*', getErrorPage);

function getErrorPage(req, res) {
  res.render('pages/error');
}
app.listen(PORT, () => {
  console.log('listeneing on ', PORT);
});
