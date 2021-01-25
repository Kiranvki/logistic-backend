// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {


  // create a new salesman
  joiPickerBoyCreate: Joi.object().keys({
    empId: Joi.string().trim().label('emp id').optional().allow('').max(12),
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
    city: Joi.string().trim().lowercase().label('city').required().valid(['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']),
    profilePic: Joi.string().trim().label('Profile Pic').optional().allow('').regex(/^[a-fA-F0-9]{24}$/).options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id'
          }
        }
      }
    }),
    firstName: Joi.string().trim().label('first name').regex(/^[a-z ,.'-]+$/i).options({
      language: {
        string: {
          regex: {
            base: 'should be a valid first Name'
          }
        }
      }
    }).required(),
    lastName: Joi.string().trim().label('last name').regex(/^[a-z ,.'-]+$/i).options({
      language: {
        string: {
          regex: {
            base: 'should be a valid last Name'
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
    }).optional().allow(''),
    email: Joi.string().email().trim().label('email').required().max(256),
    reportingManagerId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Reporting Manager Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id'
          }
        }
      }
    }),
    gender: Joi.string().trim().lowercase().valid(['male', 'female', 'transgender']).optional().allow('')
  }),

  // get picker boy list
  joiPickerBoyList: Joi.object().keys({
    page: Joi.number().integer().min(1).label('Page').required(),
    search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
    status: Joi.string().trim().lowercase().valid(['active', 'inactive']).optional().allow(''),
  }),

  // joi saleman details 
  joiPickerBoyGetDetails: Joi.object().keys({
    pickerBoyId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('PickerBoy Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    })
  }),

  //get Picker list
  joiPickerList: Joi.object().keys({
    page: Joi.number().integer().min(1).label('Page').required(),
    search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
}),

  // joi in in params
  joiIdInParams: Joi.object().keys({
    pickerBoyId: Joi.string().trim().label('PickerBoy Id').required(),
  }),


};

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



  // create a new salesman
  joiPickerBoyCreate: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiPickerBoyCreate;
    let option = options.basic;

    // replacing space with - 
    req.body.contactMobile = req.body.contactMobile.replace(/\s/g, '-')

    let contactArray = req.body.contactMobile.split('-');

    if (contactArray.length > 1) {
      req.body.contactMobile = contactArray[1];
    } else req.body.contactMobile = contactArray[0];

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

  // get picker boy list
  joiPickerBoyList: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiPickerBoyList;
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

  // joi PickerBoy details
  joiPickerBoyGetDetails: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiPickerBoyGetDetails;
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



  // joi id in params
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

      // joi Picker list 
      joiPickerList: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiPickerList;
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
  

}