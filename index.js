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
app.use(exppress.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.get('/', getHomePage);

function getHomePage(req, res) {
    res.render('pages/index');
}




app.get('*', getErrorPage);

function getErrorPage(req, res) {
    res.render('pages/error');
}
app.listen(PORT, () => {
    console.log('listeneing on ', PORT);
});