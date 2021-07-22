// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');


const schemas = {
   getModelByTransporterId: Joi.object().keys({
   params: {
       transporterId: Joi.string().required()
   }
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
    getModelByTransporterId : (req, res, next) => {
        // getting the schemas 
        let schema = schemas.getModelByTransporterId;
        let option = options.basic;

        // validating the schema 
        schema.validate(req.params, option).then(() => {
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