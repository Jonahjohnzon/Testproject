const mongoose = require('mongoose');
const { Property } = require("../../Schema/propertySchema")
const { startOfMonth, endOfMonth } = require('date-fns');
const {Transaction} = require("../../Schema/transactionSchema")


//Get monthly return
const Getmonthly = async(request, response)=>{
    try{
    const {userId,year} = request.body


    const result  = await Transaction.aggregate([
        {$match:{admin:userId,type:rent,
        createdAt: {
          $gte: new Date(`${year}-01-01`),  // Start of the year
          $lte: new Date(`${year}-12-31`)   // End of the year
    }}},
    {
        $group: {
          _id: { $month: "$createdAt" },  // Group by month (1=January, 12=December)
          totalAmount: { $sum: "$amount" }  // Sum the amount field
    }
    },
    {
        $sort: { "_id": 1 } 
    }
    ])
    // Prepare an array of 12 elements (one for each month) initialized with 0
    const monthlyTotals = Array(12).fill(0);

    // Fill the monthlyTotals array with the result from the aggregation
    result.forEach(item => {
                 monthlyTotals[item._id - 1] = item.totalAmount;  // _id is the month number (1 for January, 12 for December)
            });



    const results = await Property.aggregate([
            { 
                $match: { 
                    admin: userId, // Match properties associated with the admin
                    acquisitionDate: {
                          $gte: new Date(`${year}-01-01`),  // Start of the year
                          $lte: new Date(`${year}-12-31`)   // End of the year
                    }
                } 
        },
            { 
                $group: {
                      _id: { $month: "$acquisitionDate" },  // Group by month (1=January, 12=December)
                      averageOccupancy: { $avg: "$occupancy" }  // Sum the rentAmount field
                }
            },
            { 
                  $sort: { "_id": 1 }  // Sort by month in ascending order
            }
        ]);
    // Initialize an array for average occupancy (12 months)
    const monthlyAverageOccupancy = Array(12).fill(0);
    // Populate the array with the result from the aggregation
    results.forEach(item => {
      monthlyAverageOccupancy[item._id - 1] = item.averageOccupancy;  // Adjust for array index (1=January, 12=December)
    });


    response.status(200).json({monthlyTotals, monthlyAverageOccupancy});
    }
    catch(error)
    {
    response.status(500).json({ error: "Something went wrong" });
    }

}

module.exports = {Getmonthly}