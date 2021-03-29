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



  // joi get customer details
  joiCustomerGet: Joi.object().keys({
    customerId: Joi.string().trim().label('Customer Id').required(),
  }),





  // joi get customer other details 
  joiAddItem: Joi.object().keys({
    params: {
      pickerBoySalesOrderMappingId: Joi.string().trim().label('PickerBoy SalesOrder Mapping Id').required(),
    },
    body: Joi.object({
      item_no: Joi.number().label('item_no').required(),
      itemName: Joi.string().trim().label('itemName').required(),
      salePrice: Joi.number().label('salePrice').required(),
      quantity: Joi.number().label('quantity').required(),
      suppliedQty: Joi.number().label('suppliedQty').required(),
      itemAmount: Joi.number().label('itemAmount').required(),
      taxPercentage: Joi.number().label('taxPercentage').required(),
      discountPercentage: Joi.number().label('discountPercentage').required(),
      freeQty: Joi.number().label('freeQty').required(),
    }).min(1)
  }),


  // joi edit item details
  joiEditAddedItem: Joi.object().keys({
    params: {
      pickerBoySalesOrderMappingId: Joi.string().trim().label('PickerBoy SalesOrder Mapping Id').required(),
    },
    body: Joi.object({
      itemId: Joi.number().label('itemId').required(),
      itemName: Joi.string().trim().label('itemName').optional(),
      salePrice: Joi.number().label('salePrice').optional(),
      quantity: Joi.number().label('quantity').optional(),
      suppliedQty: Joi.number().label('suppliedQty').optional(),
      itemAmount: Joi.number().label('itemAmount').optional(),
      taxPercentage: Joi.number().label('taxPercentage').optional(),
      discountPercentage: Joi.number().label('discountPercentage').optional(),
      freeQty: Joi.number().label('freeQty').optional(),
    }).min(1)
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


  // joi get customer other 
  joiAddItem: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiAddItem;
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


  // joi get customer other 
  joiEditAddedItem: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiEditAddedItem;
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
