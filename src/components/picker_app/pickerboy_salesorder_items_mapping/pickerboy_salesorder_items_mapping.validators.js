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
  joiGoFrugalSync: Joi.object().keys({
    city: Joi.string().trim().lowercase().label('city').required().valid(['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']),
  }),

  // joi asm create
  joiASMCreate: Joi.object().keys({
    empId: Joi.string().trim().label('emp id').required().max(12),
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
    contactMobile: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('itemId').options({
      language: {
        string: {
          regex: {
            base: 'should be a valid Phone Number'
          }
        }
      }
    }).optional().allow(''),
    email: Joi.string().email().trim().label('email').required().max(256),
    reportingManagerId: Joi.string().trim().label('Reporting Manager Id').required()
  }),

  // get asm list 
  joiCustomersList: Joi.object().keys({
    query: {
      page: Joi.number().integer().min(1).label('Page').required(),
      search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
    },
    body: {
      group: Joi.array().items(Joi.string().trim().lowercase().label('Group')).optional().allow(''),
      subGroup: Joi.array().items(Joi.string().trim().lowercase()).label('Group').optional().allow(''),
      salesmanId: Joi.array().items(Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Salesman Id').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id.'
            }
          }
        }
      })).optional().allow('')
    }
  }),

  // joi get customer details
  joiCustomerGet: Joi.object().keys({
    customerId: Joi.string().trim().label('Customer Id').required(),
  }),

  // joi tally sync 
  joiTallySync: Joi.object().keys({
    type: Joi.string().trim().label('Type').required().valid(['payment', 'invoice', 'debit', 'credit']),
    city: Joi.string().trim().label('City Id').lowercase().required().valid(['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']),
  }),

  // joi tally upload 
  joiTallyUpload: Joi.object().keys({
    type: Joi.string().trim().label('Type').required().valid(['payment', 'invoice', 'debit', 'credit', 'accounts']),
    city: Joi.string().trim().label('City Id').lowercase().required().valid(['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']),
  }),

  // joi get customer other details 
  joiAddItem: Joi.object().keys({
    params: {
      pickerBoySalesOrderMappingId: Joi.string().trim().label('PickerBoy SalesOrder Mapping Id').required(),
    },
    body: Joi.object({
      itemId: Joi.number().integer().label('itemId').required(),
      itemName: Joi.string().trim().label('itemName').required(),
      salePrice: Joi.number().integer().label('salePrice').required(),
      quantity: Joi.number().integer().label('quantity').required(),
      suppliedQty: Joi.number().integer().label('suppliedQty').required(),
      itemAmount: Joi.number().integer().label('itemAmount').required(),
      taxPercentage: Joi.number().integer().label('taxPercentage').required(),
      discountPercentage: Joi.number().integer().label('discountPercentage').required(),
      freeQty: Joi.number().integer().label('freeQty').required(),

    }).min(1)
  }),

  // joi invoice payment refresh  
  joiInvoicePaymentRefresh: Joi.object().keys({
    city: Joi.string().trim().label('City Id').lowercase().required().valid(['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']),
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
  joiGoFrugalSync: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiGoFrugalSync;
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
  joiASMCreate: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiASMCreate;
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

  // joi asm list 
  joiCustomersList: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiCustomersList;
    let option = options.basic;

    // validating the schema 
    schema.validate({ query: req.query, body: req.body }, option).then(() => {
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

  // joi customer get 
  joiCustomerGet: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiCustomerGet;
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

  // joi tally sync 
  joiTallySync: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiTallySync;
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

  // joi get customer other 
  joiAddItem: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiAddItem;
    let option = options.basic;

    // validating the schema 
    schema.validate({ params: req.params, query: req.query }, option).then(() => {
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

  // joi tally upload 
  joiTallyUpload: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiTallyUpload;
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

  // joi invoice payment refresh 
  joiInvoicePaymentRefresh: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiInvoicePaymentRefresh;
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
