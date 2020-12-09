// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
  joiTransporterCreate: Joi.object().keys({
    code: Joi.string().trim().label('Code').required(),
    name: Joi.string().trim().label('name').regex(/^[a-z ,.'-]+$/i).options({
      language: {
        string: {
          regex: {
            base: 'should be a valid last Name'
          }
        }
      }
    }).required(),
    noOfRateCategories: Joi.string().trim().label('No.of Rate Categories').required(),
    emailID: Joi.string().email().trim().label('email').required().max(256),
    contactNo: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Phone Number').required({
      language: {
        string: {
          regex: {
            base: 'should be a valid Phone Number'
          }
        }
      }
    }).required(),
    location: Joi.string().trim().label('Location').required()
    }),


      // joi id in params validation 
  joiDeleteTransporeter: Joi.object().keys({
    transporterid: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Transporter Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    }).required(),
  }),
    // joi Transporter get details 
    joiTransporterMaster: Joi.object().keys({
      transporterid: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Transporter Id').required().options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id.'
            }
          }
        }
      }).required(),
    }),

    // joi in in params
  joiIdInParams: Joi.object().keys({
    transporterid: Joi.string().trim().label('Transporter Id').required(),
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
  joiTransporterCreate: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.joiTransporterCreate;
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

       // joi TransporterMaster get details 
      joiTransporterMaster: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiTransporterMaster;
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
    
}