// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../../responses/response');

// joi array of objects 
const inviteAdminObject = Joi.object().keys({
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
  empId: Joi.string().trim().label('Employee Id').required().max(20),
  phoneNumber: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Phone Number').options({
    language: {
      string: {
        regex: {
          base: 'should be a valid Phone Number'
        }
      }
    }
  }).optional().allow(''),
  gender: Joi.string().trim().valid(['male', 'female', 'transgender']),
  adminType: Joi.string().trim().valid(['admin', 'superAdmin']),
  designation: Joi.string().trim().valid(['distribution manager', 'area sales manager', 'sales executive']),
  region: Joi.string().trim().valid(['chennai', 'mumbai', 'bengaluru', 'pune']),
  email: Joi.string().email().trim().label('email').required().max(256),
});

// schema
const inviteAdminArraySchema = Joi.array().items(inviteAdminObject).unique('email').min(1).max(5).required();


// add joi schema 
const schemas = {
  // check for valid user 
  joiOtpLogInValidate: Joi.object().keys({
    params: {
      type: Joi.string().trim().valid(['sms', 'email']).required()
    },
    body: {
      email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'in'] } }).trim().label('email').when('type', {
        is: 'email',
        then: Joi.required()
      }),
      mobileNumber: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Phone Number').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid Phone Number'
            }
          }
        }
      }).when('type', {
        is: 'sms',
        then: Joi.required()
      }),
    }
  }).xor('body.email', 'body.mobileNumber').min(1),

  // joi verify login 
  joiLoginVerify: Joi.object().keys({
    params: {
      deliveryExecutiveId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Salesman Id').required().options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id.'
            }
          }
        }
      }),
    },
    body: {
      otp: Joi.string().trim().regex(/^[0-9]{4}$/).label('OTP').required().options({
        language: {
          string: {
            regex: {
              base: 'should be a valid OTP.'
            }
          }
        }
      }),
      deviceToken: Joi.string().trim().label('Device Token').required()
    }
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

// exporting the modules 
module.exports = {
  // exports validate admin signin 
  joiOtpLogInValidate: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiOtpLogInValidate;
    let option = options.basic;

    // validating the schema 
    schema.validate({ params: req.params, body: { ...req.body, type: req.params.type } }, option).then(() => {
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

  // joi login verify 
  joiLoginVerify: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiLoginVerify;
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
}
