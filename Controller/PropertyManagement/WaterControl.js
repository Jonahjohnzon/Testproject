const {WaterMeter} = require('../../Schema/waterMeterSchema')
const mongoose = require('mongoose')
const {Tenant} = require('../../Schema/tenantSchema')
//Create WaterMeter

const createWaterMeter = async(request, response)=>{
    try
    {
        const {userId, } = request.body
    }
    catch(error)
    {
        return response.status(403).json({result:false, message:`${error}`})
    }
}


const GetWaterData = async(id)=>{
}

const getTenantWaterMeter = async(request, response)=>{
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
                from: 'WaterMeter', // Lookup from WaterMeter collection
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
              $project: {
                _id: 0,
                id: '$_id',
                admin: 1,
                propertyName: '$property.name',
                tenantName: '$tenant.name',
                unitNumber: '$unit',
                tenantId: 1,
                propertyId: '$property._id',
                // Include the first water meter's details
                previousReading: { $ifNull: ['$firstWaterMeter.previousReading', 0] },
                currentReading: { $ifNull: ['$firstWaterMeter.currentReading', 0] },
                readingDate: { $ifNull: ['$firstWaterMeter.readingDate', new Date()] },
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


module.exports = {getTenantWaterMeter}