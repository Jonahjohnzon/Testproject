const mongoose = require('mongoose');
const {Tenant} = require('../../Schema/tenantSchema');
const { Transaction } = require('../../Schema/transactionSchema');


const totalAmount = async (id) =>{
    const Data = await Tenant.aggregate([
        { $match: { admin: id } },
        {
          $lookup: {
            from: 'watermeters',
            localField: 'waterMeter',
            foreignField: '_id',
            as: 'waterMeterDetails'
          }
        },
        {
          $addFields: {
            firstWaterMeter: { $arrayElemAt: ['$waterMeterDetails', 0] } // Get first water meter details
          }
        },
        {
          $lookup: {
            from: 'garbages',
            localField: 'garbage',
            foreignField: '_id',
            as: 'garbage'
          }
        },
        {
          $addFields: {
            garbage: { $arrayElemAt: ['$garbage', 0] } // Get first garbage entry
          }
        },
        {
          $project: {
            garbageAmount: { $ifNull: ['$garbage.amount', 0] }, // Garbage amount
            rentAmount: { $ifNull: ['$rentAmount', 0] }, // Rent amount
            waterAmount: { $ifNull: ['$firstWaterMeter.amount', 0] }, // Water meter amount
            month: { $month: '$createdAt' } // Extract month from createdAt
          }
        },
        {
          $group: {
            _id: '$month', // Group by month
            totalGarbage: { $sum: '$garbageAmount' }, // Total garbage per month
            totalRentAmount: { $sum: '$rentAmount' }, // Total rent per month
            totalWaterAmount: { $sum: '$waterAmount' } // Total water amount per month
          }
        },
        {
          $sort: { _id: 1 } // Sort by month (1 = January, 12 = December)
        },
        {
          $group: {
            _id: null,
            totals: {
              $push: {
                month: '$_id',
                totalGarbage: '$totalGarbage',
                totalRentAmount: '$totalRentAmount',
                totalWaterAmount: '$totalWaterAmount'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalsgarbage: {
              $map: {
                input: { $range: [1, 13] }, // Iterate over months 1 to 12
                as: 'month',
                in: {
                  $let: {
                    vars: {
                      matchingMonth: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$totals',
                              as: 't',
                              cond: { $eq: ['$$t.month', '$$month'] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $ifNull: ['$$matchingMonth.totalGarbage', 0] // Default to 0 if no data
                    }
                  }
                }
              }
            },
            totalRentAmount: {
              $map: {
                input: { $range: [1, 13] }, // Iterate over months 1 to 12
                as: 'month',
                in: {
                  $let: {
                    vars: {
                      matchingMonth: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$totals',
                              as: 't',
                              cond: { $eq: ['$$t.month', '$$month'] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $ifNull: ['$$matchingMonth.totalRentAmount', 0] // Default to 0 if no data
                    }
                  }
                }
              }
            },
            totalswater: {
              $map: {
                input: { $range: [1, 13] }, // Iterate over months 1 to 12
                as: 'month',
                in: {
                  $let: {
                    vars: {
                      matchingMonth: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$totals',
                              as: 't',
                              cond: { $eq: ['$$t.month', '$$month'] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $ifNull: ['$$matchingMonth.totalWaterAmount', 0] // Default to 0 if no data
                    }
                  }
                }
              }
            }
          }
        }
      ]);
      
      return Data
}

const getTenantInvoice = async(request, response)=>{
    try
    {
        const {userId, } = request.body
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
              $lookup: {
                from: 'watermeters', // Lookup from WaterMeter collection
                localField: 'waterMeter',
                foreignField: '_id',
                as: 'waterMeterDetails'
              }
            },
            {
                // Use $arrayElemAt to get the first element from the waterMeterDetails array
                $addFields: {
                  firstWaterMeter: { $arrayElemAt: ['$waterMeterDetails', 0] }
                }
              },
            {
                $lookup: {
                  from: 'garbages', // Lookup from WaterMeter collection
                  localField: 'garbage',
                  foreignField: '_id',
                  as: 'garbage'
                }
              },
              {
                // Use $arrayElemAt to get the first element from the waterMeterDetails array
                $addFields: {
                    garbage: { $arrayElemAt: ['$garbage', 0] }
                }
              }
         ,
            {
              $project: {
                _id: 0,
                id: '$_id',
                propertyName: '$property.name',
                tenantName: '$tenant.name',
                unitNumber: '$unit',
                rentAmount:1,
                status:1,
                tenantId: 1,
                leaseEndDate:1,
                // Include the first water meter's details
                previousReading: { $ifNull: ['$firstWaterMeter.previousReading', 0] },
                currentReading: { $ifNull: ['$firstWaterMeter.currentReading', 0] },
                garbage:{ $ifNull: ['$garbage.amount', 0] },
                water:{ $ifNull: ['$firstWaterMeter.amount', 0] },
                amount: {
                    $add: [
                      '$rentAmount',
                      { $ifNull: ['$garbage.amount', 0] },
                      { $ifNull: ['$firstWaterMeter.amount', 0] }
                    ]
                  }
              }
            }
          ]);

          const total = await totalAmount(id)

          return response.status(200).json({result:true, data:Data, display:total[0]})
    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }
}

const TotalRent =async(id)=>{
  const rentInvoice = await Transaction.find({admin:id, status:"Completed", type:"rent"}).populate({path:'user',select: 'name'}).populate({path:' property_id', select:'name'}).populate({path:'tenant', select:'unit'})
  return rentInvoice
}

//Get Receipt
const getRecipt = async(request, response)=>{

  try{
    const {userId, } = request.body
    const id = new mongoose.Types.ObjectId(userId)
    const Data = await Transaction.aggregate([
      {
        // Match completed rent transactions
        $match: {
          type: "rent",
          status: "Completed",
          admin:id
        }
      },
      {
        // Group by year and month using createdAt
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" }
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      {
        // Sort by year and month
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      },
      {
        // Create an array with total amounts for each month
        $group: {
          _id: "$_id.year", // Group by year (or remove if you want for all years)
          monthlyTotals: {
            $push: {
              month: "$_id.month",
              totalAmount: "$totalAmount"
            }
          }
        }
      },
      {
        // Format the result to get amounts for each month (1-12), filling missing months with 0
        $project: {
          totals: {
            $map: {
              input: { $range: [ 1, 13 ] }, // Range from 1 (January) to 12 (December)
              as: "month",
              in: {
                $let: {
                  vars: {
                    matched: { 
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$monthlyTotals",
                            as: "entry",
                            cond: { $eq: [ "$$entry.month", "$$month" ] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: { 
                    $ifNull: [ "$$matched.totalAmount", 0 ] // Return 0 if no matching month found
                  }
                }
              }
            }
          }
        }
      }
    ]);
    
    let data;
    if(Data.length == 0)
    {
      data = [0,0,0,0,0,0,0,0,0,0,0,0]
    }
    else{
      data = Data
    }

    const getTotalRent = await TotalRent()
    return response.status(200).json({result:true, data, TotalRents: getTotalRent})
    
  }
  catch(error)
  {
    console.log(error)
    return response.status(403).json({result:false, message:`${error}`})
  }
}


module.exports = {getTenantInvoice,getRecipt}