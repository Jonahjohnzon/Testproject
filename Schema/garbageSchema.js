const {Schema,model} =  require('mongoose')

const Garbage = Schema({
    property:{
        type:Schema.Types.ObjectId,
        ref:'Property'
    },
    tenant:{
        type:Schema.Types.ObjectId,
        ref:'Tenant'
    },
    amount:{
        type:Number
    },
    admin:{
         type:Schema.Types.ObjectId,
         ref:'User'
    },
    previousReading:{
        type:Number,
    },
    currentReading:{
        type:Number,
    }
    ,
    readingDate:{
        type:Date
    },
    unit:{
        type:String
    },
    previousImage:{
        type:String
    },
    currentImage:{
        type:String
    }
},{timestamps:true})

module.exports.Garbage = model('Garbage', Garbage)