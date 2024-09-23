const {User} = require("../../Schema/userSchema")
const bcrypt = require("bcrypt")
const JWT = require("jsonwebtoken")
const verifyEmail = require("../../Email/signupEmail")
const {registrationSchema,loginSchema} = require("../ValidationSchema/Schema")



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


    //email comtent
    let emailContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
    <p>Hello,</p>
    <b>Please verify your Keja account by clicking the button below</b>
    <br/><br/>
    <a href="http://localhost:3000/activation/${emailtoken}" 
       style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
       Activate email
    </a>
    <br/>
    <p style="color: #ff0000;"><b>Note:</b> This link is only valid for one hour.</p>
    <p>Best regards,<br/>Keja Team</p>
    </div>
`;

//email title
const emailTitle = "Verify Keja Account"
    //send activation link
    verifyEmail({
        userEmail:Cap_email,
        emailContent,
        emailTitle
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

//activate email
const emailActivation = async(request, response)=>{
    try{
    const token = request.body.token

    //Comfirm token
    const verifyEmail = JWT.verify(token, process.env.EMAIL_TOKEN)

    const userCheck = await User.findOne({ email: verifyEmail.Cap_email });
    // Check if email is already verified
    if(userCheck.verified)
    {
        return response.status(200).json({result:false, message:`Email already verified`})
    }

    //Verify user
    const updateResult = await User.findOneAndUpdate({email:verifyEmail.Cap_email},{
        $set:{
            verified:true
        }
    })

    if(updateResult)
    {
    return response.status(200).json({result:true, message:`Email verified`})
    } else {
        return response.status(404).json({ result: false, message: "User not found" });
    }

    }
    catch(error)
    {
        return response.status(400).json({result:false, message:`Authentication Error`})
    }
}

const userData = async (request, response) =>{
try{
    const id = request.body.userId

    //get user details
    const data = await User.findOne({_id: id},{password:0})
    if(!data){
        return response.status(400).json({result:false, message:'User not found'})
    }

    return response.status(200).json({result:true, message:"user Details", userDetails:data})
}
catch(error)
{
    return response.status(500).json({result:false, message:`Error when getting user details`})

}

}
module.exports = {
    signUp,
    logIn,
    emailActivation,
    userData 
}