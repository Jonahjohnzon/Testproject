const express = require('express')
const router = express.Router()
const {
    signUp,
    logIn

} = require('../Controller/AccountController')

//AccountController Routes
router.post('/api/signup', signUp)
router.post('/api/login', logIn)

module.exports = router