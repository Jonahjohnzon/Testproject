const {Schema,model} =  require('mongoose')

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
    payment_history:[{type:Schema.Types.ObjectId,
        ref:'Transaction'}],
    maintenance_request:[{ 
        type:Schema.Types.ObjectId,
        ref:'Maintenance'}],
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
    },
    admin:{
        type:Schema.Types.ObjectId,
        ref:'Users'
    }
},{timestamps:true})

module.exports.Tenant = model('Tenant', Tenant)