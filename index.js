'use strict';

require('dotenv').config();
let PORT = process.env.PORT;
let express = require('express');
let session = require('express-session');
let path = require('path');
let pg = require('pg');
let app = express();
let superagent = require('superagent');
let cors = require('cors');
let methodOverride = require('method-override');
const {
  stat
} = require('fs');
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
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.get('/', getHomePage);
app.get('/signup' ,getSignUpPage);
app.post('/register', registerUser);

function getHomePage(req, res) {
  res.render('pages/index');
}
var msg ='';
function getSignUpPage(req, res) {

  res.render('pages/signuppage/signup', {alertMsg: msg});
}

function registerUser (req, res) {

  let inputData ={
    first_name: req.body.fname,
    last_name: req.body.lname,
    email_address: req.body.email,
    gender: req.body.gender,
    password: req.body.psw,
    confirm_password: req.body['psw-repeat']
  };
  // check unique email address
  const SQL='SELECT * FROM registration WHERE email_address = $1';
  client.query(SQL, [inputData.email_address]).then((data) => {
    console.log('input DATA', inputData);
    console.log('DAta.rows', data.rows);
    if(data.rowCount > 0){
      console.log('emailExist', data.rows);
      msg = inputData.email_address+ ' was already exist';
    }else if(inputData.confirm_password !== inputData.password){
      console.log('password did not matched', data.rows);
      msg ='Password & Confirm Password is not Matched';
    }else{
      // save users data into database
      msg ='Your are successfully registered';
      const val = [inputData.first_name, inputData.last_name, inputData.email_address, inputData.gender, inputData.password];
      var SQL = 'INSERT INTO registration (first_name, last_name, email_address, gender, password) VALUES ($1, $2, $3, $4, $5) ';
      client.query(SQL, val).then(() => {
        console.log('success', data.rows);
      });
    }
    res.render('pages/signuppage/signup', {alertMsg:msg});
  });

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
