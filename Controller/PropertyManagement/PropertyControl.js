const { Property } = require("../../Schema/propertySchema")


const createProperty = async(request, response) =>{
    try{
    //Admin id
   
    const {name, address, status, description, units, parking_space, property_type,acquisition_date,image, amenties,nearby_facilities, userId} = request.body
    //create property
    const property = await Property.create({
      name,
      address,
      status,
      description,
      units,
      "admin.userId":userId,
      parking_space,
      property_type,
      acquisition_date,
      image,
      amenities,
      nearby_facilities
    })

    await property.save()
    return response.status(200).json({
        result: true,
        message: "Property created "
    })
    }
    catch(error){
        return response.status(400).json({result:false, message:`${error}`})
    }
}


module.exports = {createProperty}