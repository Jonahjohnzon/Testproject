const express = require('express')
const app = express()
const cors = require('cors');
const mongoosedb = require('./mongoose');
const router = require('./Routes/Routes')
const passport = require('passport');
const session = require('express-session');
require('dotenv').config()

app.use(cors());
mongoosedb()
app.use(require('express').json())

//auth session
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true
  }));

app.use(passport.initialize());
app.use(passport.session());

//route control
app.use('/', router)

//Port  Running
const port = process.env.PORT || 8080
app.listen(port, ()=>{
    console.log('Connected to port: ' + port)
})

module.exports = app;