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
    balance:{
        type:Number
    },
    tenant_id:{
        type:Schema.Types.ObjectId,
        ref:'Tenant'
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
    }
},{timestamps:true})

module.exports.Transaction = model("Transaction", Transaction)