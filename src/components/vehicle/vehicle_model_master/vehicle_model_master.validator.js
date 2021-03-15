// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');


const schemas = {
   create: Joi.object().keys({
    name: Joi.string().trim().required(),
    brand: Joi.string().trim().required(),
    tonnage: Joi.number().required(),
   }),

   JoiGetVehilceModelList: Joi.object().keys({
    page: Joi.number().integer().min(1).label('Page').required()
}),
JoiGetVehilceModelByTransporterId: Joi.object().keys({
    transporterId: Joi.string().required()
}),
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
    joiVehicleModelCreate: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.create;
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
    
    JoiGetVehilceModelList : (req, res, next) => {
        // getting the schemas 
        let schema = schemas.JoiGetVehilceModelList;
        let option = options.basic;

        // validating the schema 
        schema.validate(req.query, option).then(() => {
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

    JoiGetVehilceModelByTransporterId : (req, res, next) => {
        // getting the schemas 
        let schema = schemas.JoiGetVehilceModelByTransporterId;
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
    // joiVehicleModelGet: (req, res, next) => {
    //     // getting the schemas 
    //     let schema = schemas.getVehicleModel;
    //     let option = options.basic;

    //     // validating the schema 
    //     schema.validate(req.params, option).then(() => {
    //         next();
    //         // if error occured
    //     }).catch((err) => {
    //         let error = [];
    //         err.details.forEach(element => {
    //             error.push(element.message);
    //         });

    //         // returning the response 
    //         Response.joierrors(req, res, err);
    //     });
    // }
}