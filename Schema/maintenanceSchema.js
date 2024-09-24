const {Schema,model} =  require('mongoose')

const Maintenance = Schema({
    issue:{
        type:String
    },
    title:{
        type:String
    },
    status:{
        type:String,
        enum:["pending", "progress","completed"]
    }
    ,
    tenant_id:{
        type:Schema.Types.ObjectId,
        ref:'Tenant'
    },
    property_id:{
         type:Schema.Types.ObjectId,
        ref:'Property'
    },
    unit:{
        type:Schema.Types.ObjectId,
        ref:'Unit'
    },
    admin:{
         type:Schema.Types.ObjectId,
        ref:'User'
    }
},{timestamps:true})

module.exports.Maintenance = model("Maintenance", Maintenance)