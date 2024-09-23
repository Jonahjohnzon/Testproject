const express = require('express')
const router = express.Router()
const adminRoute = require('../middleware/adminRoute')
const verifyRole = require('../middleware/verifyRole')
const tokenVerification = require("../middleware/tokenVerification")
const {
    signUp,
    logIn,
    emailActivation,
    userData 

} = require('../Controller/AccountManagement/AccountController')
const {
    createProperty
} = require('../Controller/PropertyManagement/PropertyControl')
const {
    roleConfiguration
} = require('../Controller/AccountManagement/AccountConfiguration')


//AccountController Routes
router.post('/api/signup', signUp)
router.post('/api/login', logIn)
router.put('/api/emailverification', emailActivation)
router.get('/api/userdetails',tokenVerification, userData )

//AccountConfiguration Routes
router.put('/api/roleupdate',verifyRole, roleConfiguration)


//PropertyController Routes
router.post('/api/createProperty',adminRoute,createProperty)

module.exports = router