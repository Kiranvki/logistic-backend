// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
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
        gender: Joi.string().trim().lowercase().valid(['male', 'female', 'transgender']).optional().allow('')
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

  }