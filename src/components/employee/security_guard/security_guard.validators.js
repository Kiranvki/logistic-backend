// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {

  // get zoho details
  joiGetZohoDetails: Joi.object().keys({
    empId: Joi.string().trim().label('empId').required(),
  }),

  // create a new emloyee
  joiEmployeCreate: Joi.object().keys({
    designation: Joi.string().trim().label('designation').required().valid(['securityGuard', 'pickerBoy', 'deliveryExecutive']),
    empId: Joi.string().trim().label('Employee id').optional().allow('').max(12),
    isWaycoolEmp: Joi.boolean().label('Is Waycool Employee').required(),
    agencyId: Joi.string().trim().label('Agency Id').when('isWaycoolEmp', {
      is: true,
      then: Joi.optional().allow(''),
      otherwise: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required().options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id'
            }
          }
        }
      })
    }),
    fullName: Joi.string().trim().label('Employee Name').regex(/^[a-z ,.'-]+$/i).options({
      language: {
        string: {
          regex: {
            base: 'should be a valid  Name'
          }
        }
      }
    }).required(),


    contactMobile: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Contact Number').options({
      language: {
        string: {
          regex: {
            base: 'should be a valid Phone Number'
          }
        }
      }
    }).required().allow(''),
    altContactMobile: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Alt Contact Number').options({
      language: {
        string: {
          regex: {
            base: 'should be a valid Phone Number'
          }
        }
      }
    }).optional().allow(''),
    email: Joi.string().email().trim().label('email').required().max(256),
    altEmail: Joi.string().email().trim().label('alt Email').optional().max(256).allow(''),
    managerName: Joi.string().trim().label('Manager Name').regex(/^[a-z ,.'-]+$/i).options({
      language: {
        string: {
          regex: {
            base: 'should be a valid Manager Name'
          }
        }
      }
    }).optional(),
  }),

  // joi asm patch 
  joiEmployePatch: Joi.object().keys({
    params: {
      employeeId: Joi.string().trim().label('Employee Id'),
      employeeType: Joi.string().trim().label('Brand Id').required().valid(['securityGuard', 'pickerBoy', 'deliveryExecutive'])
    },
    body: Joi.object({
      fullName: Joi.string().trim().label('Employee Name').regex(/^[a-z ,.'-]+$/i).options({
        language: {
          string: {
            regex: {
              base: 'should be a valid  Name'
            }
          }
        }
      }).optional(),

      contactMobile: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Contact Number').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid Phone Number'
            }
          }
        }
      }).optional().allow(''),
      altContactMobile: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Alt Contact Number').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid Phone Number'
            }
          }
        }
      }).optional().allow(''),
      email: Joi.string().email().trim().label('email').optional().max(256),
      altEmail: Joi.string().email().trim().label('alt Email').optional().max(256).allow(''),
      managerName: Joi.string().trim().label('Manager Name').regex(/^[a-z ,.'-]+$/i).options({
        language: {
          string: {
            regex: {
              base: 'should be a valid Manager Name'
            }
          }
        }
      }).optional(),

    }).min(1)
  }),

  joiEmployeeGetDetails: Joi.object().keys({

    employeeId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Employee Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    }).required(),
    employeeType: Joi.string().trim().label('Employee Type').required().valid(['securityGuard', 'pickerBoy', 'deliveryExecutive'])

  }),

  //get Security Guard list
  joiEmployeeList: Joi.object().keys({
    page: Joi.number().integer().min(1).label('Page').required(),
    search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
  }),

  // joi employee status
  joiEmployeeChangeStatus: Joi.object().keys({
    employeeId: Joi.string().trim().label('Employee Id').required(),
    type: Joi.string().trim().valid(['activate', 'deactivate']).label('Type').required()
  }),
}


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
}


module.exports = {

  // create a new emloyee
  joiEmployeCreate: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiEmployeCreate;
    let option = options.basic;

    // replacing space with - 
    req.body.contactMobile = req.body.contactMobile.replace(/\s/g, '-')

    let contactArray = req.body.contactMobile.split('-');

    if (contactArray.length > 1) {
      req.body.contactMobile = contactArray[1];
    } else req.body.contactMobile = contactArray[0];

    req.body.altContactMobile = req.body.altContactMobile.replace(/\s/g, '-')

    let altContactArray = req.body.altContactMobile.split('-');

    if (altContactArray.length > 1) {
      req.body.altContactMobile = altContactArray[1];
    } else req.body.altContactMobile = altContactArray[0];

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

  // joi employee patch
  joiEmployePatch: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiEmployePatch;
    let option = options.basic;

    // replacing space with - 
    if (req.body.contactMobile) {
      req.body.contactMobile = req.body.contactMobile.replace(/\s/g, '-')

      let contactArray = req.body.contactMobile.split('-');

      if (contactArray.length > 1) {
        req.body.contactMobile = contactArray[1];
      } else req.body.contactMobile = contactArray[0];
    }

    if (req.body.altContactMobile) {
      req.body.altContactMobile = req.body.altContactMobile.replace(/\s/g, '-')

      let altContactArray = req.body.altContactMobile.split('-');

      if (altContactArray.length > 1) {
        req.body.altContactMobile = altContactArray[1];
      } else req.body.altContactMobile = altContactArray[0];

    }

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

  // get zoho details
  joiGetZohoDetails: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiGetZohoDetails;
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


  // joi Employee get details 
  joiEmployeeGetDetails: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiEmployeeGetDetails;
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

  // joi Employee list 
  joiEmployeeList: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiEmployeeList;
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

  // joi Employee change status
  joiEmployeeChangeStatus: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiEmployeeChangeStatus;
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