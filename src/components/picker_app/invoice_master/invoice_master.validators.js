// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
  // joi zoho details 
    // joi start pick salesorder
  joiGenerateInvoice: Joi.object().keys({
      pickerBoySalesOrderMappingId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('pickerboy SO mapping Id').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id.'
            }
          }
        }
      }).required()
    }),
  // joi start pick salesorder
  joiGetInvoiceDetails: Joi.object().keys({
      invoiceId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Invoice Id').options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    }).required()
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
  // exports validate admin signin 
  joiGetInvoiceDetails: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiGetInvoiceDetails;
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

  // joi asm create 
  joiGenerateInvoice: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiGenerateInvoice;
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
