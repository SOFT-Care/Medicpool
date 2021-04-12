'use strict';

require('dotenv').config();
const PORT = process.env.PORT;
const express = require('express');
const path = require('path');
const app = express();
const superagent = require('superagent');
const cors = require('cors');
const methodOverride = require('method-override');
const {
  data
} = require('jquery');

app.use(cors());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/jquery', express.static(path.join(__dirname + '/node_modules/jquery/dist/')));
app.use(express.static(path.join(__dirname, 'data')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.json());
app.use(express.urlencoded({
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
  superagent.get(`https://api.covid19api.com/country/${param}?from=2021-03-01T00:00:00Z&to=2020-04-01T00:00:00Z`).then(retData => {
    const dataByCountry = {
      name: param,
      dates: [],
      deaths: [],
      recovered: [],
      active: [],
      confirmed: []
    }
    retData.body.forEach(elem => {
      dataByCountry.dates.push(elem.Date);
      dataByCountry.deaths.push(elem.Deaths);
      dataByCountry.recovered.push(elem.Recovered);
      dataByCountry.confirmed.push(elem.Confirmed);
      dataByCountry.active.push(elem.Active);
    });
    res.send(dataByCountry);
  });
}

function createSearch(req, res) {
  let location = req.body.location;

  let key = process.env.GOOGLE_AUTH;
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=clinic&key=${key}&region=${location}`;

  superagent.get(url)
    .then(apiResponse => {
      return apiResponse.body.results.map(doctorResult => new Doctor(doctorResult))
    })
    .then((results) => {
      console.log(results);
      res.render('pages/searches/results', {
        searchResults: results
      })
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