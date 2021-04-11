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



app.get('*', getErrorPage);

function getErrorPage(req, res) {
    res.render('pages/error');
}
app.listen(PORT, () => {
    console.log('listeneing on ', PORT);
});