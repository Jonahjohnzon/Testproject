const express = require('express')
const router = express.Router()
const {
    signUp,
    logIn

} = require('../Controller/AccountManagement/AccountController')

//AccountController Routes
router.post('/api/signup', signUp)
router.post('/api/login', logIn)


//google auth

module.exports = router