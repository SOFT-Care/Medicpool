'use strict';

require('dotenv').config();
let PORT = process.env.PORT;

let exppress = require('express');
let app = exppress();
app.set('view engine', 'ejs');

app.use('/', (req, res) => {
    res.render('pages/index');
});

app.listen(PORT, () => {
    console.log('listeneing on ', PORT);
});