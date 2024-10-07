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
        $lookup: {
          from: 'users',
          localField: 'tenantId',
          foreignField: '_id',
          as: 'tenant'
        }
      },
      { 
        $unwind: '$tenant' 
      },
      {
        $project: {
          profile_image: '$tenant.profile_image', 
          name: '$tenant.name', 
          leaseStartDate:1,
          leaseEndDate: 1,
           unit: 1,
          status:1,
          rentAmount:1
        }
      },
      {
        $limit: 5 // Limit the result to top 5 tenants
      },
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

//Get property name
const getPropertyname =async(request, response)=>{
  try{
    const {userId} = request.body
    const id = new mongoose.Types.ObjectId(userId)

    const data = await Property.find({admin:id}).select('name rentAmount _id')

    return response.status(200).json({result:true, data })
    
  }
  catch(error)
  {
 return response.status(403).json({result:false, message:`${error}`})
  }
}


//monthly Graph
const monthlyGraph = async (propertyId)=>{
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
      propertyId: propertyId,
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
          _id: propertyId,
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


//GetmonthlyPropertyDetail 
const getMonthlyProperty = async(request, response)=>{
  try{
    const {userId} =  request.body
    const {propertyId} = request.query
    const id = new mongoose.Types.ObjectId(propertyId)
    const Data = await Property.findOne({_id:propertyId, admin:userId})
    if(!Data)
    {
      return response.status(403).json({result:false, message:`property doesn't exist`})
    }

    const occupancyPercentage = ((Data.tenants.length / Data.units) * 100).toFixed(2); // Round to two decimal places

    const data ={
      _id:Data._id,
      name:Data.name,
      totalUnits:Data.units,
      occupiedUnits:Data.tenants.length,
      occupancyRate: occupancyPercentage,
      averageRent: Data.rentAmount
    }
  const {monthlyOccupants, monthlyUnits} = await monthlyGraph(id)

  const occupancyRates = monthlyOccupants.map((occupants, index) => {
    const units = monthlyUnits[index] || 0; // Fallback to 0 if units are not available
    const occupancyRate = units > 0 ? (occupants / units) * 100 : 0; 
    return Math.round(occupancyRate);
  });

  return response.status(200).json({result:true, data, occupancyRates})
  }
  catch(error)
  {
    return response.status(403).json({result:false, message:`${error}`})
  }
}

const Openmaintenance = async (id)=>{

  const result = await Maintenance.aggregate([
    // Match documents where admin is the given ID
    { 
        $match: { admin: id } 
    },
    // Group by status and count each status
    {
        $group: {
            _id: '$status',
            count: { $sum: 1 }
        }
    },
    // Project the results into a more readable format
    {
        $group: {
            _id: null,
            totalMaintenance: { $sum: '$count' },
            statuses: { 
                $push: { 
                    status: '$_id', 
                    count: '$count' 
                }
            }
        }
    },
    // Sort the statuses to be more readable
    {
        $project: {
            totalMaintenance: 1,
            statuses: {
                $arrayToObject: {
                    $map: {
                        input: '$statuses',
                        as: 'status',
                        in: { k: '$$status.status', v: '$$status.count' }
                    }
                }
            }
        }
    }
]);

return result.length > 0 ? result[0] : { totalMaintenance: 0, statuses: { Open: 0, inProgress: 0, Completed: 0 }};

}


const eachProperty = async (id)=>{
  const eachOccupancy = await Property.aggregate([
    { 
      $match: { admin:id } // Match properties for the specific admin
    },
    {
      $lookup: {
        from: 'transactions', // Reference the Transaction collection
        localField: 'transactions', // Match the transaction field in Property schema
        foreignField: '_id', // Match it with the `_id` field in Transaction schema
        as: 'transactions' // Alias for the joined transactions
      }
    },
    { 
      $project: {
        name: 1, // Include the name of the property
        tenants: { $size: { $ifNull: ["$tenants", []] } }, // Count the tenants
        units: { $ifNull: ["$units", 0] }, // Include units (use 0 if null)
        maintenanceRequest: {$size: {$ifNull : ["$maintenanceRequest", []]}},
        rentCollected: {
          $sum: {
            $cond: {
              if: { $eq: ["$transactions.type", "rent"] }, // Filter transactions of type 'rent'
              then: "$transactions.amount", // Sum the amount if type is 'rent'
              else: 0
            }
          }
        },
        depositCollected: {
          $sum: {
            $cond: {
              if: { $eq: ["$transactions.type", "deposit"] }, // Filter transactions of type 'deposit'
              then: "$transactions.amount", // Sum the amount if type is 'deposit'
              else: 0
            }
          }
        }
      }
    }
  ]);

  return eachOccupancy
}


//property for manager
const getManagerProperty = async(request, response)=>{
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
          units: { $ifNull: ["$units", 0] }, // Ensure value is 0 if null
          occupancy: { $size: { $ifNull: ["$tenants", []] } }, // Ensure value is 0 if null
          rentAmount: {
            $multiply: [ { $ifNull: ["$rentAmount", 0] }, { $size: { $ifNull: ["$tenants", []] } } ]
          }
        }
      },
      { 
        $group: { 
          _id: null, 
          totalUnits: { 
            $sum: "$units" // Sum of units
          }, 
          totalOccupied: { 
            $sum: "$occupancy" // Sum of occupancy
          },
          totalAmount: { 
            $sum: "$rentAmount" // Sum of totalAmount calculated previously
          },
        }
      }
      ]);

      const totalProperties = await Property.countDocuments({ admin: id });
      const totalCollected = await RentTotalCollected(id)
      const getOpenmaintenance = await Openmaintenance(id)
      const getMaintenance = await Maintenance.find({admin:id})
    
      // Handling the result:
      const totalUnits = total.length > 0 ? total[0].totalUnits : 0;
      const totalOccupied = total.length > 0 ? total[0].totalOccupied : 0;
      const totalRentAmount = total.length > 0 ? total[0].totalAmount : 0;
      const eachOccupancy = await eachProperty(id)

     

      const data = {
        totalCollected,
        getOpenmaintenance,
        totalOccupied,
        totalUnits,
        totalRentAmount,
        totalProperties,
        getMaintenance,
        eachOccupancy
      }

     return response.status(200).json({return:true,data:data})
  }
  catch(error)
  {
    return response.status(403).json({result:false, message:`${error}`})
  }

}
module.exports = {createProperty, getProperty, totalProperties,getPropertyById, getPropertyname, RentTotalCollected, getMonthlyProperty, getManagerProperty }