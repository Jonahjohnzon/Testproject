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


//Get property
const getProperty = async (request, response) =>{
    try{
        const {userId} = request.body

        //find property
        const properties = await Property.find({admin:userId})
        response.status(200).json({result:true, data:properties})
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
const RentTotal = async (id) =>{
  const result = await Transaction.aggregate([
    {$match :{admin:id, type:"rent"}},
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
            { $match: { admin: id } }, // Match properties for the specific admin            
            { 
              $group: { 
                _id: null, 
                totalEstimatedPropertyValue: { $sum: { $ifNull: ["$estimatedPropertyValue", 0] } }, // Sum estimated property values or 0
                totalUnits: { $sum: { $ifNull: ["$units", 0] } }, // Sum of units
                totalOccupied: { $sum: { $ifNull: ["$occupancy", 0] } } ,// Sum of occupancy,
                totalAmount:{ $sum: { $ifNull: ["$rentAmount", 0] } }
              }
            }
          ]);

          const totalCollected = RentTotal(id)
          
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
        const Topdata = {
           totalRent:totalAmount,
           occupancyRate : result,
           propertiesValue:totalEstimatedPropertyValue,
           maintenanceRequest:totalOpenRequests,
           totalRentCollected:totalCollected

        }

       const totalMonthlyCollected = monthPay(id)
       const topTenants = topTenant(id)
        const MonthlyCollected = {
            totalMonthlyCollected,
            totalAmount,
        }
        const recentTransaction = recentTransction(id)
        const data ={
          leadData : Topdata,
          monthlyData : MonthlyCollected,
          topTenants,
          recentTransaction
        }

        return response.status(200).json({result:true, data })

    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }
}
module.exports = {createProperty, getProperty, totalProperties}