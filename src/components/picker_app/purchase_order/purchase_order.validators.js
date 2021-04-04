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
  poList: Joi.object().keys({
    page: Joi.number().integer().min(1).label('Page').required(),
    poNumber:Joi.number().integer().label('Purchase order Number').optional(),
  }),
  joiPurchaseOrderFilter: Joi.object().keys({
    params:{
      type:Joi.string().trim().label('Type for filter ').valid('ongoing', 'pending','history')
    },
    query:{
      page: Joi.number().integer().min(1).label('Page').required(),
    }
  }),
  // joi asm create
  joiPoIdValidation: Joi.object().keys({
    poId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Purchase order Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    })
  }),
  joiVendorNoValidation: Joi.object().keys({
    vendor_number: Joi.string().trim().required()
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
  joiPoIdValidation: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiPoIdValidation;
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
  joiVendorNoValidation: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiVendorNoValidation;
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
  joiPurchaseOrderFilter: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiPurchaseOrderFilter;
    let option = options.basic;

    // validating the schema 
    schema.validate({params:req.params,query:req.query}, option).then(() => {
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
  poList: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.poList;
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
