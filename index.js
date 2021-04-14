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
const {
  log
} = require('console');
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
  cookie: {
    maxAge: 60000
  }
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
app.get('/searches/find', showForm); // Shows the form of search
app.post('/searches', createSearch); // Renders the result of the search
app.post('/reserve', reserveAppointment);
app.get('/appointments', getAppointments);
//Update Patient Informaion
app.get('/editprofile', renderUpdatePatient);
app.put('/editprofile', updateOnePatient);
//Save Updated Patient Information 
app.post('/')
//Delect Patient From DataBase
app.delete('/deleteprofile', deleteOnePatient);

function getHomePage(req, res) {
  res.render('pages/index');
}
let msg = '';

function showForm(request, response) {
  response.render('pages/searches/find');
}

function getCovid19(req, res) {
  res.render('pages/corona-page/search');
}

function doctorWorkHours() {
  this['0'] = [];
  this['1'] = [];
  this['2'] = [];
  this['3'] = [];
  this['4'] = [];
  this['5'] = [];
  this['6'] = [];
}

function createSearch(req, res) {
  let isAvailable = false;
  let docArr = [];
  let location = req.body.location;
  let speciality = req.body.speciality;
  let time = req.body.time;
  let date = new Date(req.body.date);
  let key = process.env.GOOGLE_AUTH;
  let hourTime = '';
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?region=${location}&input=${speciality}+doctor+clinic+${location}&inputtype=textquery&key=${key}`;
  superagent.get(url).then(async apiResponse => {
    let docList = apiResponse.body.results.filter(elem => elem.opening_hours);
    for (let i = 0; i < docList.length; i++) {
      await superagent.get(`https://maps.googleapis.com/maps/api/place/details/json?key=${key}&place_id=${docList[i].place_id}`)
        .then(retData => {
          if (retData.body.result.opening_hours && retData.body.result.opening_hours.periods.length > 2) {
            let newDocTimes = new doctorWorkHours();
            retData.body.result.opening_hours.periods.forEach(time => {
              let timeOpenFormated = time.open.time;
              newDocTimes[time.open.day].push(timeOpenFormated);
              let timeCloseFormated = time.close.time;
              newDocTimes[time.close.day].push(timeCloseFormated);
            });
            let reservationDay = date.getDay();
            if (newDocTimes[`${reservationDay}`].length > 0) {
              hourTime = time.replace(':', '');
              if (parseInt(hourTime) > parseInt(newDocTimes[`${reservationDay}`][0]) && parseInt(hourTime) < parseInt(newDocTimes[`${reservationDay}`][1])) {
                isAvailable = true;
              }
            }
            docArr.push(new Doctor(docList[i], speciality, isAvailable, retData.body.result.formatted_phone_number))
          }
        });
    }
    res.render('pages/searches/results', {
      searchResults: docArr,
      dateTime: req.body.date,
      time: hourTime
    });
  });
};

function Doctor(info, speciality, available, phone) {
  this.name = info.name;
  this.speciality = speciality;
  this.location = info.formatted_address;
  this.availability = available ? 'Available' : 'Not Available';
  this.phoneNum = phone;
  // this.img = info.
}

function reserveAppointment(req, res) {
  if (!req.session.patientId) {
    res.redirect('/login')
  }
  let {
    docName,
    docSpec,
    docLoc,
    timeFrom,
    timeTo,
    day,
    phone
  } = req.body;
  let doc_id = 0;
  client.query('select * from Doctor join Contact on Doctor.doctor_id=Contact.doc_id where Doctor.doctor_name=$1 and Contact.phone_number=$2', [docName, phone]).then(data => {
    if (data.rows.length > 0) {
      doc_id = data.rows[0].doctor_id;
      console.log('ifffffff', req.session);
      client.query('insert into Appointments (day,time_from,time_to,pat_id,doc_id) values($1,$2,$3,$4,$5)', [day, timeFrom, timeTo, req.session.patientId, doc_id]).then(() => {
        res.redirect('/appointments')
      });
    } else {
      client.query('insert into doctor (doctor_name,doctor_speciailty,doc_location) values ($1,$2,$3) returning *', [docName, docSpec, docLoc])
        .then((data2) => {
          client.query('insert into Contact (phone_number,doc_id) values($1,$2)', [phone, data2.rows[0].doctor_id]).then(() => {
            console.log('elseeeeeeeeeeee', req.session);
            client.query('insert into Appointments (day,time_from,time_to,pat_id,doc_id) values($1,$2,$3,$4,$5)', [day, timeFrom, timeTo, req.session.patientId, data2.rows[0].doctor_id]).then(() => {
              res.redirect('/appointments')
            });
          });
        });
    }
  });
}

function getAppointments(req, res) {
  if (!req.session.patientId) {
    res.redirect('/login')
  }
  const SQL = `SELECT Appointments.pat_id,Appointments.appoi_id, Appointments.day,Appointments.time_from,Appointments.time_to, Doctor.doctor_name, Doctor.doctor_speciailty, Doctor.doc_location, Contact.phone_number
  from ((Doctor
  inner join Appointments on Doctor.doctor_id = Appointments.doc_id)
  inner join Contact on Doctor.doctor_id = Contact.doc_id)
  where Appointments.pat_id =$1`;
  client.query(SQL, [req.session.patientId]).then(data => {
    res.render('pages/searches/appointments', {
      elems: data.rows
    });
  });
}

function getSignUpPage(req, res) {
  if(!req.session.loggedinUser){
  res.render('pages/user/signup', {
    alertMsg: msg
  });
} else { res.redirect('/profile'); }
}

function getLoginPage(req, res) {
  if(!req.session.loggedinUser){
    res.render('pages/user/login', {alertMsg: msg});
  } else {res.redirect('/profile');}
}

function registerUser(req, res) {
  // get the user data from the form
  let inputData = {
    first_name: req.body.fname,
    last_name: req.body.lname,
    email_address: req.body.email,
    gender: req.body.gender,
    dateOfBirth: req.body.birthday,
    password: req.body.psw,
    confirm_password: req.body['psw-repeat']
  };
  // check unique email address
  const SQL = 'SELECT Patient.patient_id FROM Patient join Contact on Patient.patient_id =Contact.pat_id WHERE Contact.e_mail = $1';
  client.query(SQL, [inputData.email_address]).then((data) => {
    if (data.rowCount > 0) {
      msg = inputData.email_address + ' was already exist';
      // check if both passwords fields matched
    } else if (inputData.confirm_password !== inputData.password) {
      msg = 'Password & Confirm Password is not Matched';
    } else {
      // save a new user data into database
      msg = 'Your are successfully registered';
      const val = [inputData.first_name, inputData.last_name, inputData.gender, inputData.dateOfBirth, inputData.password];
      let SQL = 'INSERT INTO Patient (patient_first_name, patient_last_name, gender, date_of_birth, patient_password) VALUES ($1, $2, $3, $4, $5) RETURNING *';
      let SQL2 = 'INSERT INTO Contact (e_mail,pat_id) values ($1,$2)'
      client.query(SQL, val).then((result) => {
        const {
          patient_id
        } = result.rows[0];
        client.query(SQL2, [inputData.email_address, patient_id])
      });
    }
    // redirect to register page with an alert msg confirm what happen
    res.render('pages/user/signup', {
      alertMsg: msg
    });
  });
}

function getLogin(req, res) {
  let emailAddress = req.body.email;
  let password = req.body.psw;
  const SQL = 'SELECT * FROM Patient join Contact on Patient.patient_id =Contact.pat_id WHERE Contact.e_mail =$1 AND Patient.patient_password =$2';
  client.query(SQL, [emailAddress, password]).then((data) => {
    if (data.rowCount > 0) {
      console.log(data.rows[0]);
      req.session.loggedinUser = true;
      req.session.patientId = data.rows[0].patient_id;
      req.session.emailAddress = emailAddress;
      req.session.gender = data.rows[0].gender;
      req.session.dateOfBirth = data.rows[0].date_of_birth;
      req.session.name = `${data.rows[0].patient_first_name} ${data.rows[0].patient_last_name}`;
      res.redirect('/profile');
    } else {
      msg = 'Your Email Address or password is wrong';
      res.render('pages/user/login', {
        alertMsg: msg
      });
    }
  });
}

function getProfile(req, res) {
  if (req.session.loggedinUser) {
    res.render('pages/user/profile', {
      data: req.session
    });
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

function updateOnePatient(request, response) {
  const patientId = request.session.patientId;
  const {
    firstName,
    lastName,
    gender,
    dateOfBirth,
    password
  } = request.body;
  let values = [firstName, lastName, gender, dateOfBirth, password, patientId];
  const email = request.body.email;
  let values2 = [email, patientId];
  console.log('values', values2);
  const SQL = `UPDATE  Patient SET 
                                 patient_first_name  = $1   ,
                                 patient_last_name   = $2   , 
                                 gender              = $3   ,
                                 date_of_birth        = $4   ,
                                 patient_password    = $5   
                                 WHERE patient_id =  $6  `;
  client.query(SQL, values).then(results => {
    msg = 'Your Profile has been Updated';
    const SQL2 = `UPDATE Contact  SET
                              e_mail = $1  WHERE pat_id =$2`;
  client.query(SQL2, values2).then(results => {
    response.redirect(`/login`);
  });
  })
  
}

function renderUpdatePatient(request, response) {
  console.log('session is ', request.session.patientId);
  // response.render('/pages/user/editprofile')
  const SQL = `SELECT * FROM Patient WHERE patient_id = $1 `;
  client.query(SQL, [request.session.patientId]).then(data => {
    let resultArr =[];
    resultArr.push(data.rows[0]);
    const SQL2 = 'SELECT * from Contact where pat_id = $1';
    client.query(SQL2, [request.session.patientId]).then(dataTwo => {
      console.log('edit profile page variable sql2 ', dataTwo.rows[0]);
      const emailValue = dataTwo.rows[0]['e_mail'];
      resultArr.push({'email' : emailValue});
      console.log('edit profile page variable step2', resultArr);
      response.render('pages/user/editprofile', {
        user: resultArr
      });

    });
    
  })
}

function deleteOnePatient(request, response) {
  const patientId = request.params.patientId;
  let values = [patientId];
  const SQL = `DELETE FROM Patient
                              WHERE Patient_id   = $1  `
  client.query(SQL, values).then(results => {
    response.redirect(`/pages/user/profile`);
  })
}