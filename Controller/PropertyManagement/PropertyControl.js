const mongoose = require('mongoose');
const { Property } = require("../../Schema/propertySchema")
const { startOfMonth, endOfMonth } = require('date-fns');
const {Tenant} = require("../../Schema/tenantSchema")
const {Transaction} = require("../../Schema/transactionSchema")
const {Maintenance} = require("../../Schema/maintenanceSchema")

const createProperty = async(request, response) =>{
    try{
    //Admin id
   
    const {name, location, description, units, parkingSpace, type,acquisitionDate,image, amenities,nearbyFacilities, userId,estimatedPropertyValue, managers,rentAmount,leaseTerms} = request.body
    //create property
    const property = await Property.create({
      name,
      location,
      description,
      units,
      admin:userId,
      parkingSpace,
      type,
      acquisitionDate,
      image,
      amenities,
      nearbyFacilities,
      estimatedPropertyValue,
      managers,
      rentAmount,
      leaseTerms
    })

    await property.save()
    return response.status(200).json({
        result: true,
        message: "Property created "
    })
    }
    catch(error){
        return response.status(403).json({result:false, message:`${error}`})
    }
}


//Get One property
const getPropertyById = async (request, response) =>{
  try{
    const {propertyId} = request.query
    const pid = new mongoose.Types.ObjectId(propertyId)

    const property = await Property.aggregate([
      {
        $match: { _id: pid }
      },
      {
        $project: {
          name: 1,
          _id: 1,
          location: 1,
          units: 1,
          rentAmount: 1,
          managers: 1,
          description:1,
          amenities:1,
          leaseTerms:1,
          occupancyUnits:{ $ifNull: [{ $size: "$tenants" }, 0] },
          occupancy: {
            $cond: {
              if: { $eq: ["$units", 0] },  // Avoid division by zero
              then: 0,
              else: { $multiply: [{ $divide: [{ $size: "$tenants" }, "$units"] }, 100] } // Calculate occupancy rate
            }
          },
          type:1,
          nearbyFacilities:1,
          acquisitionDate:1,
          image:1,
        }
      }
    
    ])

    const maintenanceRequests = await Maintenance.find({ property_id: pid }).countDocuments();
    const revenue = await Transaction.aggregate([
      {
          $match: {
              property_id: pid,
              $or: [
                  { type: "rent" },
                  { type: "deposit" }
              ]
          }
      },
      {
          $group: {
              _id: null, // Grouping by null to get the total sum
              totalAmount: { $sum: "$amount" } // Summing the amount field
          }
      }
  ]);
  
  const totalRevenue = revenue.length > 0 ? revenue[0].totalAmount : 0;
  
    if (property && property.length > 0) {
      property[0].maintenanceRequests = maintenanceRequests;
      property[0].monthlyRevenue = totalRevenue
    }
    // Send response with the modified property
    response.status(200).json({ result: true, data: property[0] });

 
  }

  catch(error){
    return response.status(403).json({result:false, message:`${error}`})
  }
}

//Get property
const getProperty = async (request, response) =>{
    try{
        const {userId} = request.body
        const {limit} = request.query

        const id = new mongoose.Types.ObjectId(userId)

        //make sure limit is a number
        const numericLimit = Number(limit) || 9;

        //find property
        const properties = await Property.aggregate([
          {
            $match: { admin: id }
          },
          {
            $project: {
              name: 1,
              _id: 1,
              location: 1,
              units: 1,
              rentAmount: 1,
              rentAmount:1,
              managers: 1,
              occupancy: {
                $cond: {
                  if: { $eq: ["$units", 0] },  // Avoid division by zero
                  then: 0,
                  else: { $multiply: [{ $divide: [{ $size: "$tenants" }, "$units"] }, 100] } // Calculate occupancy rate
                }
              },
              createdAt: 1
              ,
              status: {
                $switch: {
                  branches: [
                    { case: { $eq: [{ $multiply: [{ $divide: [{ $size: "$tenants" }, "$units"] }, 100] }, 0] }, then: "Vacant" },
                    { case: { $and: [{ $gt: [{ $multiply: [{ $divide: [{ $size: "$tenants" }, "$units"] }, 100] }, 0] }, { $lt: [{ $multiply: [{ $divide: [{ $size: "$tenants" }, "$units"] }, 100] }, 100] }] }, then: "Partially Occupied" },
                    { case: { $eq: [{ $multiply: [{ $divide: [{ $size: "$tenants" }, "$units"] }, 100] }, 100] }, then: "Occupied" }
                  ],
                  default: "Vacant"
                }
              }
            }
          },
          {
            $sort: { createdAt: -1 } // Sort by createdAt in descending order
          },
          {
            $limit: numericLimit
          }
        ]);
        
        response.status(200).json({ result: true, data: properties });
    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }
}

const monthPay = async(id)=>{

// Get the start and end of the current month
const startDate = startOfMonth(new Date());
const endDate = endOfMonth(new Date());

//Get month payment
  const total = await Transaction.aggregate([
    { $match: { admin: id, type:"rent", createdAt: { // Assuming createdAt is the timestamp field in paymentHistory
      $gte: startDate,
      $lte: endDate
    }} }, // Match properties for the specific admin
    { 
      $group: { 
        _id: null,
        totalAmount: { $sum: { $ifNull: ["$amount", 0] } } // Sum of payment amounts for this month
      }
    }
  ]);
  // Handle the result
const result = total.length > 0 ? total[0].totalAmount : 0 ;
return result
}



//Get Top tenant
const topTenant = async(id) =>{
  try{
    
    const tenants = await Tenant.aggregate([
      {
        $match: { admin: id } // Match documents where 'admin' field equals 'adminId'
      },
      {
        $sort: { tenant_score: -1 } // Sort by 'tenant_score' in descending order (highest first)
      },
      {
        $limit: 5 // Limit the result to top 5 tenants
      }
    ]);
    return tenants
  }
  catch(error)
  {

  }

}



//Get total rent
const RentTotalCollected = async (id) =>{
  const result = await Transaction.aggregate([
    {$match :{admin:id,  $or: [
      { type: "rent" },
      { type: "deposit" }
  ]}},
    {$group:{
    _id:null,
    amount:{$sum:"$amount"}
    }}
  ])
  const totalAmount = result.length > 0 ? result[0].amount : 0;
  return totalAmount
}

//Get Recent Transaction
const recentTransction = async (id) =>{
const data = await Transaction.find({admin:id}).limit(6)
return data
}

//Get Total user properties
const totalProperties = async (request, response) =>{
    try{
        const {userId} = request.body
        const id = new mongoose.Types.ObjectId(userId)
        //find property
        const total = await Property.aggregate([
          { 
            $match: { admin: id } // Match properties for the specific admin            
          }, 
          { 
            $project: {
              estimatedPropertyValue: { $ifNull: ["$estimatedPropertyValue", 0] }, // Ensure value is 0 if null
              units: { $ifNull: ["$units", 0] }, // Ensure value is 0 if null
              occupancy: { $size: { $ifNull: ["$tenants", []] } }, // Ensure value is 0 if null
              rentAmount: { $ifNull: ["$rentAmount", 0] }, // Ensure value is 0 if null
              totalAmount: {  
                 $multiply: [
                { $ifNull: ["$rentAmount", 0] }, 
                { $size: { $ifNull: ["$tenants", []] } } // Calculate totalAmount as rentAmount * number of tenants
              ]  } // Calculate totalAmount as rentAmount * units
            }
          },
          { 
            $group: { 
              _id: null, 
              totalEstimatedPropertyValue: { 
                $sum: "$estimatedPropertyValue" // Sum estimated property values
              }, 
              totalUnits: { 
                $sum: "$units" // Sum of units
              }, 
              totalOccupied: { 
                $sum: "$occupancy" // Sum of occupancy
              },
              totalAmount: { 
                $sum: "$totalAmount" // Sum of totalAmount calculated previously
              }
            }
          }
          ]);

          const totalCollected = await RentTotalCollected(id)
          
          // Handling the result:
          const totalAmount = total.length > 0 ? total[0].totalAmount : 0;
          const totalEstimatedPropertyValue = total.length > 0 ? total[0].totalEstimatedPropertyValue : 0;
          const totalUnits = total.length > 0 ? total[0].totalUnits : 0;
          const totalOccupied = total.length > 0 ? total[0].totalOccupied : 0;


          //Calculate Occupancy rate/
        const rate = (totalOccupied / totalUnits) * 100
        const result = Math.ceil(rate)
        
        const openRequests = await Maintenance.aggregate([
            { $match: { admin: id, status: "pending" } }, 
            { 
              $group: { 
                _id: null, 
                totalOpenRequests: { $sum: 1 } // Count the number of open requests
              } 
            }
          ]);
          
        const totalOpenRequests = openRequests.length > 0 ? openRequests[0].totalOpenRequests : 0;

       const totalMonthlyCollected = await monthPay(id)
       const topTenants = await topTenant(id)
        const recentTransaction =  await recentTransction(id)
        const data ={
           totalRentCollectable:totalAmount,
           occupancyRate : result,
           propertyValue:totalEstimatedPropertyValue,
           maintenanceRequests:totalOpenRequests,
           totalRentCollected:totalCollected,
           monthlyRentCollected:totalMonthlyCollected,
           toptenant:topTenants,
           recentTransactions:recentTransaction,

        }

        return response.status(200).json({result:true, data })

    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }
}

const getPropertyname =async(request, response)=>{
  try{
    const {userId} = request.body
    const id = new mongoose.Types.ObjectId(userId)

    const data = await Property.find({admin:id}).select('name')

    return response.status(200).json({result:true, data })
    
  }
  catch(error)
  {
 return response.status(403).json({result:false, message:`${error}`})
  }
}
module.exports = {createProperty, getProperty, totalProperties,getPropertyById, getPropertyname}