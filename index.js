'use strict';

require('dotenv').config();
let PORT = process.env.PORT;
let express = require('express');
let path = require('path');
let app = express();
let superagent = require('superagent');
let cors = require('cors');
var $ = require('jquery');
let methodOverride = require('method-override');
const {
    stat
} = require('fs');


app.use(express.urlencoded({
    extended: true
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
                                    rangeHours.forEach((elem, i) => {
                                        if (elem.includes("PM")) {
                                            let h = rangeHours[i][0];
                                            rangeHours[i][0] = `${newH}:${newM}`;
                                            console.log("hoursssssssssss",rangeHours[i][0]);
                                        }
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
                });

            });
        });
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
    res.render('pages/signuppage/signup');
}

app.get('*', getErrorPage);

function getErrorPage(req, res) {
    res.render('pages/error');
}
app.listen(PORT, () => {
    console.log('listeneing on ', PORT);
});
