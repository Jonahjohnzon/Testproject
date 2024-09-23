const {Schema,model} =  require('mongoose')

//Payment History
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
    },
    tenant_id:{
        type:Schema.Types.ObjectId,
        ref:'Tenant'
    }
},{timestamps:true})


//Maintenance request
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
    ,
    tenant_id:{
        type:Schema.Types.ObjectId,
        ref:'Tenant'
    }
},{timestamps:true})

const Admin = Schema({
    userId:{
         type: Schema.Types.ObjectId,
        ref: 'Users'
    }
})

const Property = Schema({
    name:{
        type:String
    },
    address:{
        type:String
    },
    status:{
        type:String,
        enum: ['occupied', 'partially occupied', 'vacant'], // Only allow these values
        message: '{VALUE} is not a valid role', 
    },
    description:{
        type:String
    },
    units:{
        type:Number
    },
    rentAmount:{
        type:Number
    },
    admin:[Admin],
    occupancyRate:{
        type:Number,
        max: 100,
        default:0
    },
    tenants:[{
        type: Schema.Types.ObjectId,
        ref: 'Tenant' 
    }],
    maintenance_request:[Maintenance],
    payment_history:[Payment],
    units:[{type:String}],
    parking_space:{
        type:String
    },
    property_type:{
        type:String,
        enum:["apartment","house","commercial"]
    },
    acquisition_date:{
        type:Date
    },
    description:{
        type:String
    },
    image:{
        type:String
    },
    amenities:[{
        type:String
    }],
    nearby_facilities:[{
        type:String
    }]
},{timestamps:true})

module.exports.Property = model("Property", Property)