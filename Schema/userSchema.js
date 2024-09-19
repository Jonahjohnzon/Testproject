const {Schema,model} =  require('mongoose')

//User notification schema
const Notification = Schema({
    message:{
        type:String
    },
    opened:{
        type:Boolean,
        default:false
    },
    sentfrom:{
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    title:{
        type:String
    },
    origin:{
        type:String,
        enum:['keja', 'user'],
        required:true
    }
},{timestamps:true})

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
    },
    profile_image:{
        type:String,
    },
    role:{
        type:String,
        enum: ['tenant', 'landlord', 'manager', 'none'], // Only allow these values
        message: '{VALUE} is not a valid role', // Custom error message
        default:'none'
    },
    phone:{
        type:String,
    },
    verified:{
        type:Boolean,
        default:false
    },
    notification:[Notification]
},{timestamps:true})

module.exports.User = model('Users',User)