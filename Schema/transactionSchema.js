const {Schema,model} =  require('mongoose')


const Transaction = Schema({
    amount:{
        type:Number
    },
    payment_method:{
        type:String,
        enum:["bank transfer", "credit card", "cash", "debit card"],
        required:true
    },
    tenant:{
        type:Schema.Types.ObjectId,
        ref:'Tenant'
    }
    ,
    balance:{
        type:Number
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    type:{
        type:String,
        enum:["rent","maintenance","deposit","refund"]
    },
    property_id:{
        type:Schema.Types.ObjectId,
        ref:'Property'
    },
    status:{
        type:String,
        enum:["Completed","Pending", "Failed"]
    },
    admin:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    StartDate: {
        type: Date, // You can change this to another type if needed (e.g., String for custom formats)
        required: true // Assuming you want this field to be mandatory
      },
    EndDate: {
        type: Date,
        required: true // Optional, depending on your use case
      },
},{timestamps:true})

module.exports.Transaction = model("Transaction", Transaction)