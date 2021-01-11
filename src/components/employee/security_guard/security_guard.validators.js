// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
<<<<<<< HEAD
    joiSecurityGuard: Joi.object().keys({
        employeeId: Joi.string().trim().label('Employee id').optional().allow('').max(12),
        isWaycoolEmp: Joi.boolean().label('Is Waycool Employee').required(),
        cityId: Joi.string().trim().lowercase().label('cityId').required().valid(['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']),
        profilePic: Joi.string().trim().label('Profile Pic').optional().allow('').regex(/^[a-fA-F0-9]{24}$/).options({
          language: {
            string: {
              regex: {
                base: 'should be a valid mongoose Id'
              }
=======

  // get zoho details
  joiGetZohoDetails: Joi.object().keys({
    empId: Joi.string().trim().label('empId').required(),
  }),

  // create a new emloyee
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
>>>>>>> 9f659712bd7e3552c361802c485e1c211ce7692b
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
    }).optional().allow(''),
    email: Joi.string().email().trim().label('email').required().max(256),
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

<<<<<<< HEAD
=======
  // create a new emloyee
  joiEmployeCreate: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiEmployeCreate;
    let option = options.basic;
>>>>>>> 9f659712bd7e3552c361802c485e1c211ce7692b


    // create a new salesman
    joiSecurityGuard: (req, res, next) => {
      // getting the schemas 
      let schema = schemas.joiSecurityGuard;
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

<<<<<<< HEAD
  }
=======
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


}
>>>>>>> 9f659712bd7e3552c361802c485e1c211ce7692b
