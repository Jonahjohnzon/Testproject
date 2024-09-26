const mongoose = require('mongoose');
const { Property } = require("../../Schema/propertySchema")
const { startOfMonth, endOfMonth } = require('date-fns');
const {Tenant} = require("../../Schema/tenantSchema")
const {Transaction} = require("../../Schema/transactionSchema")
const {Maintenance} = require("../../Schema/maintenanceSchema")
const {User} = require('../../Schema/userSchema')
const bcrypt = require("bcrypt")
const JWT = require("jsonwebtoken")
const verifyEmail = require("../../Email/signupEmail")
const {registrationSchema,loginSchema} = require("../ValidationSchema/Schema")


//Tenant creation
const TenantCreation = async(tenantId,response, propertyId,unit, securityDeposit, leaseStartDate, parkingSpace, pets, userId,leaseEndDate, numberOfOccupants,rentAmount,status)=>{

    const property = await Tenant.find({propertyId:propertyId, tenantId:tenantId})
    if(property.length > 0)
    {
        return response.status(200).json({
            result: false,
            message: "Tenant already created in property"
                }) 
    }

    const newUser = await Tenant.create({
        tenantId,
        propertyId,
        rentAmount,
        unit,
        pets,
        securityDeposit,
        leaseStartDate,
        leaseEndDate,
        parkingSpace,
        numberOfOccupants,
        admin:userId,
        status
        })

    await newUser.save();

    const tenantid = newUser._id;

    await Property.findByIdAndUpdate(
        propertyId, // Assuming propertyId is available in the context
        { $push: { tenants: tenantid } },
        { new: true, useFindAndModify: false }
    );

    return response.status(200).json({
        result: true,
        message: "Tenant created"
    })

}


const createTenant = async (request, response)=>{
    try{
        const {propertyId, email, name, unit, securityDeposit, leaseStartDate, parkingSpace, pets, userId,leaseEndDate, numberOfOccupants,rentAmount, phone, idPassportNumber, status} = request.body
        const check ={
            email,name, password:idPassportNumber, role:'tenant'
        }

        //validate object
        await registrationSchema.validate(check); 

        //create tenant user
        const Cap_email = email.toUpperCase()
        //encrypt password
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(idPassportNumber, salt)
    
        //check if email exist
        const emailExist = await User.find({email:Cap_email})
        if(emailExist.length > 0)
        {
            const tenantId = emailExist[0]._id
            TenantCreation(tenantId,response, propertyId,unit, securityDeposit, leaseStartDate, parkingSpace, pets, userId,leaseEndDate, numberOfOccupants,rentAmount, status )

        }
        else{
     //create user
        const newUser = await User.create({
        name,
        password:hashPassword,
        email:Cap_email,
        role:"tenant",
        phone
        })

        await newUser.save();
        const tenantId = newUser._id;
         //email token creation
        const emailtoken = JWT.sign({Cap_email}, process.env.EMAIL_TOKEN, {expiresIn: '24h'})


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
    <p style="color: #ff0000;"><b>Note:</b> This link is only valid for 24 hour.</p>
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
        TenantCreation(tenantId,response, propertyId,unit, securityDeposit, leaseStartDate, parkingSpace, pets, userId,leaseEndDate, numberOfOccupants,rentAmount,status )
    }


    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }
}

module.exports = {createTenant}