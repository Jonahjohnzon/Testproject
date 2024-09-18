const {User} = require("../Schema/userSchema")
const bcrypt = require("bcrypt")
const JWT = require("jsonwebtoken")
const verifyEmail = require("../Email/signupEmail")
const {registrationSchema,loginSchema} = require("./ValidationSchema/Schema")



//SignUp Function
const signUp = async(request, response)=>{
try{
    await registrationSchema.validate(request.body); 
    const {password,name,email,role} = request.body
    const Cap_email = email.toUpperCase()
    //encrypt password
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt)

    //check if email exist
    const emailExist = await User.find({email:Cap_email})
    if(emailExist.length > 0)
    {
        return response.status(200).json({result:false, message: "Email already exist"})
    }

    //create user
    const newUser = await User.create({
        name,
        password:hashPassword,
        email:Cap_email,
        role
    })

    await newUser.save();

    //email token creation
    const emailtoken = JWT.sign({Cap_email}, process.env.EMAIL_TOKEN, {expiresIn: '1h'})

    //send activation link
    verifyEmail({
        userEmail:Cap_email,
        token:emailtoken
    })

    return response.status(200).json({
        result: true,
        message: "Activation link sent to your email "
    })
}
catch(error){
    return response.status(400).json({result:false, message:`${error}`})
}
}

//user login function
const logIn = async (request, response)=>{
try{
    await loginSchema.validate(request.body);

    const {email, password} = request.body
    const Cap_email = email.toUpperCase()

    //confirm email exist
    const comfirmEmail = await User.findOne({email: Cap_email})

    if(comfirmEmail == null)
    {
        return response.status(200).json({
            result:false,
            message: "Email not found"
        })
    }

    //comfirm password 
    const passwordCheck = await bcrypt.compare(password, comfirmEmail.password)

    if(passwordCheck)
    {
        const id = comfirmEmail._id

        //create jwt_token for route verification
        const token = JWT.sign({id}, process.env.JWT, {expiresIn: '30d'})
        const Data = {
            name:comfirmEmail.name,
            email:comfirmEmail.email,
            _id:comfirmEmail._id,
        }


        return response.status(200).json({
            result:true,
            token,
            userDate:Data
        })
    }
    else{
        return response.status(200).json({result:false, message:"Incorrect password"})
    }
}
catch(error){
    return response.status(400).json({result:false, message:`${error}`})
}
}
module.exports = {
    signUp,
    logIn 
}