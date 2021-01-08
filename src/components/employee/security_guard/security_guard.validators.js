// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
  joiEmployeCreate: Joi.object().keys({
    position: Joi.string().trim().label('Employee id').required().valid(['securityGuard', 'pickerBoy', 'deliveryExecutive']),
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
    reportingManagerId: Joi.string().trim().label('first name').regex(/^[a-z ,.'-]+$/i).options({
      language: {
        string: {
          regex: {
            base: 'should be a valid Manager Name'
          }
        }
      }
    }).required(),
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



  // create a new salesman
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

}