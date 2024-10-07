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
        enum:["Open", "inProgress","Completed"]
    },
    priority:{
        type:String,
        enum:["Low", "High","Medium"]
    }
    ,
    user:{
        type:Schema.Types.ObjectId,
        ref:'User'
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