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
    createProperty,
    getProperty,
    totalProperties,
    getPropertyById,
    getPropertyname
} = require('../Controller/PropertyManagement/PropertyControl')

const { Getmonthly} = require('../Controller/PropertyManagement/Getmonthly')
const {
    roleConfiguration
} = require('../Controller/AccountManagement/AccountConfiguration')

const {createTenant} = require('../Controller/PropertyManagement/TenantController')

//AccountController Routes
router.post('/api/signup', signUp)
router.post('/api/login', logIn)
router.put('/api/emailverification', emailActivation)
router.get('/api/userdetails',tokenVerification, userData )

//AccountConfiguration Routes
router.put('/api/roleupdate',verifyRole, roleConfiguration)


//PropertyController Routes
router.post('/api/createProperty',adminRoute,createProperty)
router.get('/api/getProperty',adminRoute,getProperty)
router.get('/api/getTotalProperty',adminRoute,totalProperties)
router.get('/api/getmonthly',adminRoute,Getmonthly)
router.get('/api/getPropertyById',adminRoute, getPropertyById)
router.get('/api/getPropertyname', adminRoute,getPropertyname)

//TenantController Routes
router.post('/api/createTenant',adminRoute,createTenant)

module.exports = router