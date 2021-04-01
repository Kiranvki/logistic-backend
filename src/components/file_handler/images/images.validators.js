// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
  joiValidationForFileDownload: Joi.object().keys({
    fileType: Joi.string().trim().valid(['file', 'thumbnail']),
    fileId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('File Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id'
          }
        }
      }
    }),
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
  joiLogInValidate: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.validUser;
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

  // joi validation for file download 
  joiValidationForFileDownload: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiValidationForFileDownload;
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
