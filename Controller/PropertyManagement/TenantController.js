const mongoose = require('mongoose');
const { Property } = require("../../Schema/propertySchema")
const {Tenant} = require("../../Schema/tenantSchema")
const {User} = require('../../Schema/userSchema')
const bcrypt = require("bcrypt")
const JWT = require("jsonwebtoken")
const verifyEmail = require("../../Email/signupEmail")
const {registrationSchema} = require("../ValidationSchema/Schema")
const  {RentTotalCollected} = require("../PropertyManagement/PropertyControl")
const { startOfMonth, endOfMonth } = require('date-fns');
const { Transaction } = require('../../Schema/transactionSchema');
const { Maintenance } = require('../../Schema/maintenanceSchema');






//Monthly Units 
async function getMonthlyData(adminId) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
  
    const monthlyOccupants = new Array(12).fill(0); // Array to store total occupants for 12 months
    const monthlyUnits = new Array(12).fill(0); // Array to store total units for 12 months
  
    // Loop through the last 12 months including the current month
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);  // Calculate the correct date for each month
      const end = endOfMonth(date);
      // Fetch tenants for the month

      const occupantsResult = await Tenant.aggregate([
       {$match: {
          admin: adminId,
          // Consider tenants created before or during the month, and still renting in the month
          $and: [
            { createdAt: { $lte: end } }, // Tenants created before or during the month
          ]
        }
      },
      { $count: "totalTenants" }

      ]);
  
      // Fetch units for the month
      const unitsResult = await Property.aggregate([
        {
          $match: {
            admin: adminId,
            createdAt: { $lte: end } // Properties created before or during the month
          }
        },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: { $ifNull: ["$units", 0] } } // Sum all units for the properties
          }
        }
      ]);
  
      // Store results
      monthlyOccupants[11 - i] = occupantsResult.length > 0 ? occupantsResult[0].totalTenants : 0;
      monthlyUnits[11 - i] = unitsResult.length > 0 ? unitsResult[0].totalUnits : 0;
    }
  
    return { monthlyOccupants, monthlyUnits };
  }


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

//Create Tenant Function
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
    <a href="https://gitkeja.vercel.app/auth/activation/${emailtoken}" 
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



const getTenents = async(request, response) =>{
    try{
        const {userId} = request.body
        const id = new mongoose.Types.ObjectId(userId)
        const Data = await Tenant.aggregate([
            { $match: { admin: id } },
            { $limit: 10 },
             {
              $lookup: {
                from: 'users',
                localField: 'tenantId',
                foreignField: '_id',
                as: 'tenant'
              }
            },
            { $unwind: '$tenant' },
            {
              $lookup: {
                from: 'properties',
                localField: 'propertyId',
                foreignField: '_id',
                as: 'property'
              }
            },
            { $unwind: '$property' },
            {
              $project: {
                _id:0,
                id: '$_id',
                admin: 1,
                propertyName: '$property.name',
                tenantName: '$tenant.name',
                occupancyStartDate:'$leaseStartDate',
                occupancyEndDate:'$leaseEndDate',
                status:1,
                rentAmount:1,
                unitNumber:'$unit',
                email:"$tenant.email",
                avatar:"$tenant.profile_image",
                phone:"$tenant.phone",
                name:"$tenant.name",
                tenantId:1,
                propertyId:"$property._id"
              }
            }
          ]);
          
        return response.status(200).json({result:true, data:Data})

    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }

}


const getOccupancyRate = async(request, response) =>{
    try{
        const {userId} = request.body
        const id = new mongoose.Types.ObjectId(userId)
        //find property
        const Data = await Property.aggregate([
            { $match: { admin: id } },  // Filter the documents by admin ID
            { 
              $project: {
                totalunits: { $ifNull: ["$units", 0] }, // Ensure value is 0 if null
                occupancy: { $size: { $ifNull: ["$tenants", []] } }, // Ensure value is 0 if null
              }
            },
            {
              $group: {
                _id: null,  // Group all documents together
                totalProperties: { $sum: 1 },  // Count total properties
                totalunits: { $sum: "$totalunits" },  // Sum of total units across all properties
                totalOccupancy: { $sum: "$occupancy" }  // Sum of total occupancy across all properties
              }
            },
            {
              $project: {
                _id: 0,  // Exclude the _id field from the result
                totalProperties: 1,
                totalunits: 1,
                totalOccupancy: 1,
                averageOccupancyRate: {
                  $round: [
                    {
                      $cond: { 
                        if: { $eq: ["$totalunits", 0] },  // Avoid division by zero
                        then: 0,
                        else: { 
                          $multiply: [
                            { $divide: ["$totalOccupancy", "$totalunits"] }, 
                            100 
                          ]
                        }
                      }
                    },
                    2 // Rounds to the nearest integer
                  ]
                }
              }
            }
          ]);
          const totalRentCollected = await RentTotalCollected(id)
          const {monthlyOccupants, monthlyUnits} = await  getMonthlyData(id)

          const occupancyRates = monthlyOccupants.map((occupants, index) => {
            const units = monthlyUnits[index] || 0; // Fallback to 0 if units are not available
            const occupancyRate = units > 0 ? (occupants / units) * 100 : 0; 
            return Math.round(occupancyRate);
          });

         if(Data && Data.length > 0)
        {
            Data[0].totalRentCollected = totalRentCollected
            Data[0].occupancyRatesMonthly = occupancyRates
        }
        
        return response.status(200).json({result:true,  data:Data[0]})

    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})

    }

}

//Get tenant by id
const getTenantById = async( request, response)=>{
  try{
  const id = request.query.id
  const Data = await Tenant.findOne({tenantId:id}).populate({path:'tenantId', select:'name profile_image phone email'})
  if(!Data)
  {
    return response.status(403).json({result:false, message:'User doesnt exist'})
  }
  const Payment = await Transaction.findOne({user:id})
  const Maintenanc =  await Maintenance.find({user:id})
  const data = {
    id:id,
    avatar:Data?.tenantId?.profile_image,
    email:Data?.tenantId?.email,
    phone:Data?.tenantId?.phone,
    name:Data?.tenantId?.name,
    unitNumber:Data?.unit,
    leaseInfo:{
      startDate:Data?.leaseStartDate,
      endDate:Data?.leaseEndDate,
      rentAmount:Data?.rentAmount,
      securityDeposit:Data?.securityDeposit
    },
    paymentHistory:Payment ||  {},
    occupants: Data.numberOfOccupants,
    pets:Data.pets,
    maintenanceRequests:  Maintenanc
  }

  return response.status(200).json({result:true, data:data})
  }
  catch(error)
  {
    console.log(error)
  }

}

module.exports = {createTenant, getOccupancyRate, getTenents, getTenantById}