const {Schema,model} =  require('mongoose')



const Property = Schema({
    name:{
        type:String
    },
    location:{
        type:String
    },
    description:{
        type:String
    },
    units:{
        type:Number
    },
    rentAmount:{
        type:Number,
        default:0
    },
    admin:{
        type: Schema.Types.ObjectId,
       ref: 'Users'
   },
   managers:[
    {
        name:{type:String},
        phone:{type:String}
    }
   ],
    tenants:[{
        type: Schema.Types.ObjectId,
        ref: 'Tenant' 
    }],
    maintenanceRequest:[{  
        type:Schema.Types.ObjectId,
        ref:'Maintenance' }],

    paymentHistory:[{ type:Schema.Types.ObjectId,
        ref:'Transaction'}],

    unitIds:[{ type: Schema.Types.ObjectId,
        ref: 'Unit' }],
        
    parkingSpace:{
        type:String
    },
    type:{
        type:String,
        enum:["Apartment","House","Commercial","Condominium","Townhouse","SingleFamily"]
    },
    acquisitionDate:{
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
    nearbyFacilities:[{
        type:String
    }],
    estimatedPropertyValue:{
        type:Number,
        default:0
    },
    leaseTerms:{
        type:String
    }
},{timestamps:true})

module.exports.Property = model("Property", Property)