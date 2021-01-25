// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
  // check for valid user 
  joiUserAttendanceMonth: Joi.object().keys({
    month: Joi.string().trim().label('month').required().valid(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']),
    year: Joi.string().trim().regex(/^[1-2]{1}[0-9]{3}$/).required().label('yeat').options({
      language: {
        string: {
          regex: {
            base: 'should be a Valid Year !'
          }
        }
      }
    })
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
  // exports validate admin signin 
  joiUserAttendanceMonth: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiUserAttendanceMonth;
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
