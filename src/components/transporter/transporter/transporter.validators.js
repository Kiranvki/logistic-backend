// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
    joiTransporter: Joi.object().keys({
        vehicleDetails: {
            name: Joi.string().trim().label('name').regex(/^[a-z ,.'-]+$/i).options({
                language: {
                    string: {
                        regex: {
                            base: 'should be a valid Name'
                        }
                    }
                }
            }).required(),
            contactNo: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Contact Number').required({
                language: {
                    string: {
                        regex: {
                            base: 'should be a valid Phone Number'
                        }
                    }
                }
            }).required(),
            altContactNo: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Alternative Contact Number').options({
                language: {
                    string: {
                        regex: {
                            base: 'should be a valid Phone Number'
                        }
                    }
                }
            }).optional().allow(''),
            email: Joi.string().email().trim().label('Email').required().max(256),//need change
            altEmail: Joi.string().email().trim().label('Alternative Email').optional().allow(''),
        },
        locationDetails: {
            streetNo: Joi.string().trim().label('Street no').required(),
            address: Joi.string().trim().label('Address').required(),
            city: Joi.string().trim().label('City').required(),
            country: Joi.string().trim().label('Country').required(),
            postalCode: Joi.number().min(0).max(999999).label('Pincode').required(),
        },
        contactPersonalDetails: {
            contactPersonName: Joi.string().trim().label('Contact Person Name').regex(/^[a-z ,.'-]+$/i).options({
                language: {
                    string: {
                        regex: {
                            base: 'should be a valid last Name'
                        }
                    }
                }
            }).required(),
            contactNumber: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Contact Number').required({
                language: {
                    string: {
                        regex: {
                            base: 'should be a valid Phone Number'
                        }
                    }
                }
            }).required(),
            altContactNumber: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Alternative Contact Number').options({
                language: {
                    string: {
                        regex: {
                            base: 'should be a valid Phone Number'
                        }
                    }
                }
            }).optional().allow(''),
            emailID: Joi.string().email().trim().label('Email').required().max(256),
            altEmailID: Joi.string().email().trim().label('Alternative Email').optional().allow(''),
        }
    }),

    // get Transporter list 
    joiTransporterElementList: Joi.object().keys({
        page: Joi.number().integer().min(1).label('Page').required(),
        search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
    }),

    // joi Transporter 
    joiDistributorChangeStatus: Joi.object().keys({
        transporterId: Joi.string().trim().label('Transporter Id').required(),
        type: Joi.string().trim().valid(['activate', 'deactivate']).label('Type').required()
    }),



    // joi Transporter patch 
    joiTransporterPatch: Joi.object().keys({
        params: {
            transporterid: Joi.string().trim().label('Transporter Id')
        },
        body: Joi.object({
            vehicleDetails: Joi.object().keys({
                name: Joi.string().trim().label('name').regex(/^[a-z ,.'-]+$/i).options({
                    language: {
                        string: {
                            regex: {
                                base: 'should be a valid last Name'
                            }
                        }
                    }
                }).optional(),
                contactNo: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Contact Number').required({
                    language: {
                        string: {
                            regex: {
                                base: 'should be a valid Phone Number'
                            }
                        }
                    }
                }).optional(),
                altContactNo: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Alternative Contact Number').options({
                    language: {
                        string: {
                            regex: {
                                base: 'should be a valid Phone Number'
                            }
                        }
                    }
                }).optional().allow(''),
                email: Joi.string().email().trim().label('Email').optional().max(256),
                altEmail: Joi.string().email().trim().label('Alternative Email').optional(),
            }),
            locationDetails: Joi.object().keys({
                streetNo: Joi.string().trim().label('Street no').optional(),
                address: Joi.string().trim().label('Address').optional(),
                city: Joi.string().trim().label('City').optional(),
                country: Joi.string().trim().label('Country').optional(),
                postalCode: Joi.number().min(0).max(999999).label('Pincode').optional(),
            }),
            contactPersonalDetails: Joi.object().keys({
                contactPersonName: Joi.string().trim().label('Contact Person Name').regex(/^[a-z ,.'-]+$/i).options({
                    language: {
                        string: {
                            regex: {
                                base: 'should be a valid last Name'
                            }
                        }
                    }
                }).optional(),
                contactNumber: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Contact Number').optional({
                    language: {
                        string: {
                            regex: {
                                base: 'should be a valid Phone Number'
                            }
                        }
                    }
                }).optional(),
                altContactNumber: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Alternative Contact Number').options({
                    language: {
                        string: {
                            regex: {
                                base: 'should be a valid Phone Number'
                            }
                        }
                    }
                }).optional().allow(''),
                emailID: Joi.string().email().trim().label('Email').optional().max(256),
                altEmailID: Joi.string().email().trim().label('Alternative Email').optional().allow(''),
            }),

        }).min(1)
    }),

    // joi in in params
    joiIdInParams: Joi.object().keys({
        transporterId: Joi.string().trim().label('Transporter Id').required(),
    }),

    joiTransporterGetDetails: Joi.object().keys({
        transporterId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Transporter Id').required().options({
            language: {
                string: {
                    regex: {
                        base: 'should be a valid mongoose Id.'
                    }
                }
            }
        }).required(),
    }),

    // get asm list 
    joiTransporterList: Joi.object().keys({
        page: Joi.number().integer().min(1).label('Page').required(),
        search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
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
    joiTransporter: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiTransporter;
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

    // joi Transporter get details 
    joiTransporterGetDetails: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiTransporterGetDetails;
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


    // joi Transporter list 
    joiTransporterList: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiTransporterList;
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

    // joi Transporter list 
    joiTransporterElementList: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiTransporterElementList;
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



    // joi Transporter element patch
    joiTransporterPatch: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiTransporterPatch;
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

    // joi Transporter change status
    joiDistributorChangeStatus: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiDistributorChangeStatus;
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