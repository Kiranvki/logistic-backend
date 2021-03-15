// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {

    //Rate Category create
    joiRateCategoryCreate: Joi.object().keys({
        rateCategoryDetails: Joi.object().keys({
            rateCategoryName: Joi.string().trim().label('Rate Category Name').required(),
            rateCategoryType: Joi.string().trim().label('Rate Category Type').required().valid('Monthly','Daily'),
            fixedRentalAmount: Joi.number().label('Fixed Rental Amount').required(),
            includedAmount: Joi.number().label('Included Amount').required(),
            includedDistance: Joi.number().label('Included Distance').required(),
            additionalAmount: Joi.number().label('Additional Amount').required(),
        }),

        // noOfVehicles: Joi.number().label('Number Of Vehicles').required()
        //     .valid(Joi.ref('vehicleDetails.length')).options({
        //         language: {
        //             any: {
        //                 allowOnly: 'Mismatch',
        //             }
        //         }
        //     }),

        // vehicleDetails: Joi.array().items(
        //     Joi.object().keys({
        //         transporterId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Transporter Id').required().options({
        //             language: {
        //                 string: {
        //                     regex: {
        //                         base: 'should be a valid mongoose Id.'
        //                     }
        //                 }
        //             }
        //         }).optional().allow(''), // keeping it optional for now,will have to make it required

        //         rateCategoryId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('RateCategory Id').required().options({
        //             language: {
        //                 string: {
        //                     regex: {
        //                         base: 'should be a valid mongoose Id.'
        //                     }
        //                 }
        //             }
        //         }).optional().allow(''),// keeping it optional for now,will have to make it required
        //     })
        // ).min(1).max(20),
    }),

    //Rate Category patch
    joiRateCategoryPatch: Joi.object().keys({
        params: {
            rateCategoryId: Joi.string().trim().label('Rate Category Id')
        },
        body: Joi.object({
            rateCategoryDetails: Joi.object().keys({
                rateCategoryName: Joi.string().trim().label('Rate Category Name').optional(),
                rateCategoryType: Joi.string().trim().label('Rate Category Type').optional(),
                fixedRentalAmount: Joi.number().label('Fixed Rental Amount').optional(),
                includedAmount: Joi.number().label('Included Amount').optional(),
                includedDistance: Joi.number().label('Included Distance').optional(),
                additionalAmount: Joi.number().label('Additional Amount').optional(),
            }).min(1),
        })
    }),

    //joi rate category add vehicle patch
    joiRateCategoryAddVehiclePatch: Joi.object().keys({
        params: {
            rateCategoryId: Joi.string().trim().label('Rate Category Id')
        },
        body: Joi.object({
            transporterId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Transporter Id').required().options({
                language: {
                    string: {
                        regex: {
                            base: 'should be a valid mongoose Id.'
                        }
                    }
                }
            }).required(), // keeping it optional for now,will have to make it required

            vehicleId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Vehicle Id').required().options({
                language: {
                    string: {
                        regex: {
                            base: 'should be a valid mongoose Id.'
                        }
                    }
                }
            }).required()
        })
    }),

    // get Rate Category list
    joiRateCategoryList: Joi.object().keys({
        page: Joi.number().integer().min(1).label('Page').required(),
        search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
        sortBy: Joi.string().trim().valid('createdAt','updatedAt')
    }),

    // joi Rate Category get details
    joiRateCategoryGetDetails: Joi.object().keys({
        rateCategoryId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Rate Category Id').required().options({
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

    // joi id in params
    joiIdInParams: Joi.object().keys({
        rateCategoryId: Joi.string().trim().label('rateCategory Id').required(),
    }),

    // joi delete ratecategory vehicle transporter mapping
    joiDeleterateCategoryVehicleTransporterMapping: Joi.object().keys({
        rateCategoryVehicleTransporterMappingId: Joi.string().trim().label('RateCategory Vehicle Transporter Mapping Id').required(),
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
    //joi rate category create
    joiRateCategoryCreate: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiRateCategoryCreate;
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

    //joi rate category patch
    joiRateCategoryPatch: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiRateCategoryPatch;
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

    //joi rate category patch
    joiRateCategoryAddVehiclePatch: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiRateCategoryAddVehiclePatch;
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

    // joi Rate Category list
    joiRateCategoryList: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiRateCategoryList;
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
    joiRateCategoryGetDetails: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiRateCategoryGetDetails;
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

    // check whether id in params
    joiDeleterateCategoryVehicleTransporterMapping: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiDeleterateCategoryVehicleTransporterMapping;
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
