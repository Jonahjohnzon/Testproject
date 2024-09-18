const jwt = require('jsonwebtoken')

const tokenVerification =(request, response, next)=>{
try{
    const token = request.headers["auth-token"]

    //check if token
    if(!token)
    {
        return response.status(400).json({result:false, message: 'Please login', login:false})
    }

    jwt.verify(token, process.env.JWT)
    return next()
    }
catch(error)
    {
        console.log(error)
        return response.status(400).json({result:false, message: 'Please login', login:false})
    }
}

module.exports = tokenVerification;