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
    getPropertyname,
    getMonthlyProperty,
    getManagerProperty 
} = require('../Controller/PropertyManagement/PropertyControl')


const { 
    Getmonthly
} = require('../Controller/PropertyManagement/Getmonthly')


const {
    roleConfiguration
} = require('../Controller/AccountManagement/AccountConfiguration')

const {
    createTenant,
    getOccupancyRate,
    getTenents,
    getTenantById
} = require('../Controller/PropertyManagement/TenantController')

const {
    createLease
} = require('../Controller/PropertyManagement/LeaseController')

const {getTenantWaterMeter} = require('../Controller/PropertyManagement/WaterControl')

const {getTenantInvoice,getRecipt} = require('../Controller/PropertyManagement/InvoiceControl')

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
router.get('/api/getMonthlyProperty', adminRoute, getMonthlyProperty)
router.get('/api/getManagerProperty', adminRoute,getManagerProperty )

//TenantController Routes
router.post('/api/createTenant',adminRoute,createTenant)
router.get('/api/getOccupancyRate', adminRoute, getOccupancyRate)
router.get('/api/getTenants',adminRoute,getTenents)
router.get('/api/getTenantById', adminRoute, getTenantById)

//LeaseController Routes
router.post('/api/createLease', adminRoute, createLease)

//WaterController Routes
router.get('/api/getTenantWaterMeter',adminRoute, getTenantWaterMeter)

//InvioceController
router.get('/api/getTenantInvoice', adminRoute, getTenantInvoice)

//ReceiptController
router.get('/api/getRecipt', adminRoute, getRecipt)

module.exports = router