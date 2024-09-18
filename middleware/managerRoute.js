const jwt = require('jsonwebtoken')
const {User} = require('../Schema/userSchema')

const managerRoute = async (request, response, next)=>{
try{
    const id = request.headers["control-id"]

    //check if token
    if(!id)
    {
        return response.status(400).json({result:false, message: 'Route not allowed'})
    }

    //find user
    const getUser = await User.findOne({_id:id})

    //check if role is manager
    if(getUser?.role == "manager")
    {
        return next()
    }
    else{
        return response.status(400).json({result:false, message:  'Route not allowed'})
    }
    }
catch(error)
    {
        console.log(error)
        return response.status(400).json({result:false, message:  'Route not allowed'})
    }
}

module.exports = managerRoute;