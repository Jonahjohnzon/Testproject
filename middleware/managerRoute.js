const jwt = require('jsonwebtoken')
const {User} = require('../Schema/userSchema')

const managerRoute = async (request, response, next)=>{
try{
    const token = request.headers["auth-token"]

    //check if token
    if(!token)
        {
            return response.status(400).json({result:false, message: 'Please login', login:false})
        }

    //verify token
    const tokenobject = jwt.verify(token, process.env.JWT)
    const id = tokenobject.id

    //find user
    const getUser = await User.findOne({_id:id})

    //check if role is manager
    if(getUser?.role == "manager")
    {
        request.userId = tokenobject.id
        return next()
    }

     //check if no role
    else if(getUser?.role == "none"){

        return response.status(400).json({result:false, message:  'Route not allowed', redirect:true})
    }
    
    else{
        return response.status(400).json({result:false, message:  'Route not allowed'})
    }

    }
catch(error)
    {
        return response.status(400).json({result:false, message:  'Route not allowed'})
    }
}

module.exports = managerRoute;