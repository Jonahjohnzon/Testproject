const {Schema,model} =  require('mongoose')

const WaterMeter= Schema({

},{timestamps:true})

//Tenant Schema
const Tenant = Schema({

    tenantId:{
        type:Schema.Types.ObjectId,
        ref:'Users'
    },
    rentAmount:{
        type:Number
    },
    tenant_score:{
        type:Number
    },
    propertyId:{
        type:Schema.Types.ObjectId,
        ref:'Property'
    },
    numberOfOccupants:{
        type:Number
    },
    pets:{
        type:Boolean
    },
    payment_history:[{type:Schema.Types.ObjectId,
        ref:'Transaction'}],
    maintenance_request:[{ 
        type:Schema.Types.ObjectId,
        ref:'Maintenance'}],
    lease_information:{
        leaseStartDate: {
            type: Date, // You can change this to another type if needed (e.g., String for custom formats)
            required: true // Assuming you want this field to be mandatory
          },
          leaseEndDate: {
            type: Date,
            required: true // Optional, depending on your use case
          },
    },
    securityDeposit:{
        type:Number
    },
    unit:{
        type:String
    },
    status:{
        type:String,
        enum:["pending","paid","incomplete"],
        default:"pending"
    },
    admin:{
        type:Schema.Types.ObjectId,
        ref:'Users'
    }
},{timestamps:true})

module.exports.Tenant = model('Tenant', Tenant)