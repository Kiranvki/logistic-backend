// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
    joiVehicleCreate: Joi.object().keys({
        regNumber: Joi.string().trim().label('Regestration Number').required(),
        vehicleType: Joi.string().trim().label('Vehicle Type').required(),
        vehicleModel: Joi.string().trim().label('Vehicle Model').required(),
        height: Joi.number().label('Vehicle Model').required(),
        length: Joi.number().label('Length').required(),
        breadth: Joi.number().label('Breadth').required()
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
    joiVehicleCreate: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiVehicleCreate;
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
