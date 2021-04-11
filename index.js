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
const {
  stat
} = require('fs');
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

// Get requests
app.get('/', getHomePage);
app.get('/covid19', getCovid19);
app.get('/corona/search', getSearchCorona);




function getHomePage(req, res) {
  res.render('pages/index');
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

app.get('*', getErrorPage);

function getErrorPage(req, res) {
  res.render('pages/error');
}
app.listen(PORT, () => {
  console.log('listeneing on ', PORT);
});