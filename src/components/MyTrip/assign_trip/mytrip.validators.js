// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

const schemas = {
    createTripVal: Joi.object().keys({
        vehicleId: Joi.array().items(Joi.string()).min(1),
        checkedInId: Joi.array().items(Joi.string()).min(1),
        salesOrderId: Joi.array().items(Joi.string()).min(1),
        deliveryDetails: Joi.optional()
    }),
    
    createSpotSalesVal: Joi.object().keys({
        items: Joi.array().items(Joi.object()).min(1),
        salesManName: Joi.string().required(),
        numberOfItem: Joi.number().required(),
        salesManId: Joi.string().required(),
        salesManCode: Joi.string().required(),
        cityId: Joi.string().required()
    }),

    createOnSpotSaleVal: Joi.object().keys({
        salesManName: Joi.string().required(),
        salesManId: Joi.string().required(),
        salesManCode: Joi.string().required(),
        numberOfItem: Joi.number().required(),
        items: Joi.array().items(Joi.object()).min(1),
        tripId: Joi.string().required(),
        vehicleId: Joi.string().required(),
        cityId: Joi.string().required()
    })

};

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
    createTripVal: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.createTripVal;
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
    },

    createSpotSalesVal: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.createSpotSalesVal;
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
    },

    createOnSpotSaleVal: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.createOnSpotSaleVal;
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