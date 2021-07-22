// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
    //vehicle create
    joiVehicleCreate: Joi.object().keys({
        regNumber: Joi.string().trim().label('Registration Number').required(),
        vehicleType: Joi.string().trim().label('Vehicle Type').required(),
        vehicleModel: Joi.string().trim().label('Vehicle Model'),
        height: Joi.number().label('Height').required(),
        length: Joi.number().label('Length').required(),
        breadth: Joi.number().label('Breadth').required(),
        tonnage: Joi.number().label('Tonnage'),
        vehicleModelId:  Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Vehicle Model Id').required().options({
            language: {
                string: {
                    regex: {
                        base: 'should be a valid mongoose Id.'
                    }
                }
            }
        }).required(),
        transporterId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Transporter Id').required().options({
            language: {
                string: {
                    regex: {
                        base: 'should be a valid mongoose Id.'
                    }
                }
            }
        }).required(), // keeping it optional for now,will have to make it required
        rateCategoryId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('RateCategory Id').required().options({
            language: {
                string: {
                    regex: {
                        base: 'should be a valid mongoose Id.'
                    }
                }
            }
        }).required(),// keeping it optional for now,will have to make it required
    }),

    // get vehicle list 
    joiVehicleList: Joi.object().keys({
        page: Joi.number().integer().min(1).label('Page').required(),
        search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
    }),

    // joi vehicle get details 
    joiVehicleGetDetails: Joi.object().keys({
        vehicleId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Vehicle Id').required().options({
            language: {
                string: {
                    regex: {
                        base: 'should be a valid mongoose Id.'
                    }
                }
            }
        }).required(),
    }),


    // joi vehicle patch
    joiVehiclePatch: Joi.object().keys({
        params: {
            vehicleId: Joi.string().trim().label('Vehicle Id')
        },
        body: Joi.object({
            regNumber: Joi.string().trim().label('Registration Number').optional(),
            vehicleType: Joi.string().trim().label('Vehicle Type').optional(),
            vehicleModel: Joi.string().trim().label('Vehicle Model').optional(),
            height: Joi.number().label('Height').optional(),
            length: Joi.number().label('Length').optional(),
            breadth: Joi.number().label('Breadth').optional(),
            tonnage: Joi.number().label('Tonnage').optional(),
        }).min(1)
    }),

    // joi in in params
    joiIdInParams: Joi.object().keys({
        vehicleId: Joi.string().trim().label('Vehicle Id').required(),
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
    },

    // joi vehicle list
    joiVehicleList: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiVehicleList;
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

    // joi vehicle get details 
    joiVehicleGetDetails: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiVehicleGetDetails;
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
    },

    // joi vehicle patch
    joiVehiclePatch: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiVehiclePatch;
        let option = options.basic;

        // validating the schema 
        schema.validate({ params: req.params, body: req.body }, option).then(() => {
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

    // check whether id in params
    joiIdInParams: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiIdInParams;
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
    },

}
