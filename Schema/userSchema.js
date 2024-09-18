const {Schema,model} =  require('mongoose')

//User Schema
const User = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true,
        enum: ['tenant', 'landlord', 'manager'], // Only allow these values
        message: '{VALUE} is not a valid role' // Custom error message
    },
    phone:{
        type:String,
    },
    verified:{
        type:Boolean,
        default:false
    },
    notification:{
        number:{
        type:Number,
        default:1
        },
        alert:{
        type:Boolean,
        default:true
        }
    }
},{timestamps:true})

module.exports.User = model('Users',User)