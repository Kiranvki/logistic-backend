// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
joiVehicle  : Joi.object().keys({
    // regNumber:  Joi.string().trim().label('Regestration Number').required().max(12),
    // vehicleType: Joi.string().trim().label('Vehicle Type').required().max(12),
    // vehicleModel: Joi.string().trim().label('Vehicle Model').required().max(12),
    // height:Joi.string().trim().label('Vehicle Model').required().max(12),
    // length: Joi.string().trim().label('Length').required().max(12),
    // breadth: Joi.string().trim().label('Breadth').required().max(12)
})
}

// joi options
const options = {
    // generic option
    basic: {
        abortEarly: false,
        convert: true,
        allowUnknown: false,
        stripUnknown: true
    },
    // Options for Array of array
    array: {
        abortEarly: false,
        convert: true,
        allowUnknown: true,
        stripUnknown: {
            objects: true
        }
    }
};

module.exports = { 
    joiVehicle: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiVehicle;
        let option = options.basic;

        // validating the schema 
        schema.validate(req.body, option).then(() => {
            next();
            // if error occured
        }).catch((err) => {
            let error = [];
            err.details.forEach(element => {
                error.push(element.message);
            });

            // returning the response 
            Response.joierrors(req, res, err);
        });
    }

}
