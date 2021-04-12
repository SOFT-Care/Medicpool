'use strict';

require('dotenv').config();
const PORT = process.env.PORT;
const express = require('express');
const session = require('express-session');
const path = require('path');
const pg = require('pg');
const app = express();
const superagent = require('superagent');
const cors = require('cors');
const methodOverride = require('method-override');

app.use(cors());

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.log('PG Error', err));


app.use(express.urlencoded({
  extended: true
}));
app.use(session({
  secret: '123456cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));
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
app.get('/signup', getSignUpPage);
app.post('/register', registerUser);
app.get('/login', getLoginPage);
app.post('/login', getLogin);
app.get('/profile', getProfile);
app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/login');
});
app.get('/covid19', getCovid19);
app.get('/corona/search', getSearchCorona);
app.get('/searches/find', showForm); // Shows the form of search
app.post('/searches', createSearch); // Renders the result of the search


function getHomePage(req, res) {
  res.render('pages/index');
}
var msg = '';


function showForm(request, response) {
  response.render('pages/searches/find');
}

function getCovid19(req, res) {
  res.render('pages/corona-page/search');
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


const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function createSearch(req, res) {
  // console.log(req.body);
  let location = req.body.location;
  let speciality = req.body.speciality;
  let time = req.body.time;
  let day = new Date(req.body.date);
  let dayName = days[day.getDay()];

  let key = process.env.GOOGLE_AUTH;
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?region=${location}&input=${speciality}+clinic&inputtype=textquery&key=${key}`;

  superagent.get(url)
    .then(apiResponse => {
      return apiResponse.body.results.map(doctorResult => {

        superagent.get(`https://maps.googleapis.com/maps/api/place/details/json?key=${key}&place_id=${doctorResult.place_id}`).then(retData => {

          let hours = retData.body.result.opening_hours ? retData.body.result.opening_hours : "No available opening hours";
          let available = "";
          if (hours != "No available opening hours") {
            hours = hours.weekday_text.map(time => {
              return time.split(": ");
            })
            // console.log(hours);

            hours.forEach(day => {
              if (day[0].toLowerCase() == dayName.toLowerCase()) {
                if (day[1].toLowerCase() == "closed") {
                  available = `Not Available, We are closed on ${dayName}`;
                } else if (day[1].toLowerCase() == "open 24 hours") {
                  available = `Open 24 hours, Welcome anytime`;
                } else {
                  console.log(day[1]);
                  let regex = /[–,]/;
                  let rangeHours = day[1].split(regex);
                  rangeHours = rangeHours.map(elem => { return elem.trim().split(" ") });
                  let pH;
                  let aH;
                  rangeHours.forEach((elem, i) => {

                    if (elem.includes("PM")) {

                      pH = rangeHours[i][0]; // 09:00
                      // console.log("before", pH);
                      pH = parseInt(pH.split(":")[0]) + 12; // 21
                      // console.log("after", pH);

                    } else if (elem.includes("AM")) {
                      aH = rangeHours[i][0]; // 09:00
                      // console.log("before", aH);
                      aH = parseInt(aH.split(":")[0]); // 9
                      // console.log("after", aH);
                    }
                    console.log("range", pH - aH);
                  })
                  // console.log(rangeHours);
                }
              }

            })

          } else {
            available = "No available opening hours, call the clinic";
          }
          console.log(available);
          return new Doctor(doctorResult, req, available);
        }).catch(err => { console.log("ERROR!!!!!", err) });

      });
    }).catch(err => { console.log("ERROR!!!!!", err) });
  // .then((results) => {
  //     // console.log(results);
  //     // res.render('pages/searches/results', { searchResults: results })
  // })
}




function Doctor(info, request, available) {
  this.name = info.name;
  this.speciality = request.body.speciality;
  this.location = info.formatted_address;
  this.availability = available;

  // console.log(hours.weekday_text);


  // console.log(request.body.date,dayName);
  // console.log(this);
}





function getSignUpPage(req, res) {

  res.render('pages/user/signup', { alertMsg: msg });
}

function getLoginPage(req, res) {

  res.render('pages/user/login', { alertMsg: msg });
}

function registerUser(req, res) {
  // get the user data from the form
  let inputData = {
    first_name: req.body.fname,
    last_name: req.body.lname,
    email_address: req.body.email,
    gender: req.body.gender,
    password: req.body.psw,
    confirm_password: req.body['psw-repeat']
  };
  // check unique email address
  const SQL = 'SELECT * FROM registration WHERE email_address = $1';
  client.query(SQL, [inputData.email_address]).then((data) => {
    if (data.rowCount > 0) {
      msg = inputData.email_address + ' was already exist';
      // check if both passwords fields matched
    } else if (inputData.confirm_password !== inputData.password) {
      msg = 'Password & Confirm Password is not Matched';
    } else {
      // save a new user data into database
      msg = 'Your are successfully registered';
      const val = [inputData.first_name, inputData.last_name, inputData.email_address, inputData.gender, inputData.password];
      var SQL = 'INSERT INTO registration (first_name, last_name, email_address, gender, password) VALUES ($1, $2, $3, $4, $5) ';
      client.query(SQL, val).then(() => {
      });
    }
    // redirect to register page with an alert msg confirm what happen
    res.render('pages/user/signup', { alertMsg: msg });
  });

}


function getLogin(req, res) {
  let emailAddress = req.body.email;
  let password = req.body.psw;
  const SQL = 'SELECT * FROM registration WHERE email_address =$1 AND password =$2';
  client.query(SQL, [emailAddress, password]).then((data) => {
    if (data.rowCount > 0) {
      req.session.loggedinUser = true;
      req.session.emailAddress = emailAddress;
      req.session.gender = data.rows[0].gender;
      req.session.name = `${data.rows[0].first_name} ${data.rows[0].last_name}`;
      res.redirect('/profile');
    } else {
      msg = 'Your Email Address or password is wrong';
      res.render('pages/user/login', { alertMsg: msg });
    }
  });
}


function getProfile(req, res) {
  if (req.session.loggedinUser) {
    res.render('pages/user/profile', { data: req.session });
  } else {
    res.redirect('/login');
  }
}

app.get('*', getErrorPage);

function getErrorPage(req, res) {
  res.render('pages/error');
}

client.connect().then(
  app.listen(PORT, () => {
    console.log('Listeneing on', PORT);
  })
);
