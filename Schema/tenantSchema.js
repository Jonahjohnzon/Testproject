const {Schema,model} =  require('mongoose')

//Tenant Maintenance Request
const Maintenance = Schema({
    issue:{
        type:String
    },
    title:{
        type:String
    },
    status:{
        type:String,
        enum:["open, closed"]
    }
},{timestamps:true})

//Tenant Payment Schema
const Payment = Schema({
    amount:{
        type:Number
    },
    payment_method:{
        type:String,
        enum:["bank transfer", "credit card", "cash", "debit card"],
        required:true
    },
    balance:{
        type:Number
    }
},{timestamps:true})

const WaterMeter= Schema({

},{timestamps:true})

//Tenant Schema
const Tenant = Schema({

    tenant_id:{
        type:Schema.Types.ObjectId,
        ref:'Users'
    },
    contact:{
        type:String
    },
    lease:{
        type:String
    },
    rent:{
        type:Number
    },
    payment_status:{
        type:Number
    },
    tenant_score:{
        type:Number
    },
    property_id:{
        type:Schema.Types.ObjectId,
        ref:'Property'
    },
    occupants:{
        type:Number
    },
    pets:{
        type:Boolean
    },
    payment_history:[Payment],
    maintenance_request:[Maintenance],
    lease_information:{
        start_date: {
            type: Date, // You can change this to another type if needed (e.g., String for custom formats)
            required: true // Assuming you want this field to be mandatory
          },
          end_date: {
            type: Date,
            required: true // Optional, depending on your use case
          },
    },
    security_deposit:{
        type:Number
    },
    unit:{
        type:String
    },
    status:{
        type:String,
        enum:["pending","paid"],
        default:"pending"
    }
},{timestamps:true})

module.exports.Tenant = model('Tenant', Tenant)