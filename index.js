'use strict';

require('dotenv').config();
let PORT = process.env.PORT;
let exppress = require('express');
let path = require('path');
let app = exppress();
let superagent = require('superagent');
let cors = require('cors');
let methodOverride = require('method-override');
const {
    stat
} = require('fs');
app.use(cors());
app.use(methodOverride('_method'));
app.use(exppress.urlencoded({ extended: true }));
app.use(exppress.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));


app.get('/', getHomePage);
app.get('/signup', getSignUpPage);


// Shows the form of search
app.get('/searches/find', showForm);

// Renders the result of the search
app.post('/searches', createSearch);

function getHomePage(req, res) {
    res.render('pages/index');
}


function showForm(request, response) {
    response.render('pages/searches/find');
}


function createSearch(req, res) {
    // console.log(req.body);
    let location = req.body.location;
    let speciallity = req.body.speciallity;
    let key = process.env.GOOGLE_AUTH;
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?region=${location}&input=${speciallity}+clinic&inputtype=textquery&key=${key}`;

    superagent.get(url)
        .then(apiResponse => {
            return apiResponse.body.results.map(doctorResult => {
                
                superagent.get(`https://maps.googleapis.com/maps/api/place/details/json?key=${key}&place_id=${doctorResult.place_id}`).then(retData => {
                   return new Doctor(doctorResult, req,retData.body.result.opening_hours.weekday_text)
                })
            })
        })
        .then((results) => {
            // console.log(results);
            // res.render('pages/searches/results', { searchResults: results })
        })
}


function Doctor(info, request,hours) {
    this.name = info.name;
    this.speciallity = request.body.speciallity;
    this.location = info.formatted_address;
    this.opening_hours = hours;
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