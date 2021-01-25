// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {


  // joi start pick salesorder
  joiStartPickSalesOrder: Joi.object().keys({
    saleOrderId: Joi.string().trim().label('SaleOrder Id').required(),
  }),

  // joi salesorder details
  joiSalesOrderDetails: Joi.object().keys({
    saleOrderId: Joi.string().trim().label('SaleOrder Id').required(),
  }),

  // joi Scan Sales Order details
  joiScanSalesOrder: Joi.object().keys({
    pickerBoySalesOrderMappingId: Joi.string().trim().label('PickerBoy SalesOrder Mapping Id').required(),
  }),

  // joi view order basket
  joiViewOrderBasket: Joi.object().keys({
    pickerBoySalesOrderMappingId: Joi.string().trim().label('PickerBoy SalesOrder Mapping Id').required(),
  }),

  // joi customer get details 
  joiCustomerGetDetails: Joi.object().keys({
    customerId: Joi.number().integer().label('Customer Id').required(),
    cityId: Joi.string().trim().lowercase().label('city Id').required().valid(['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']),
  }),

  // joi ongoing sales order details
  joiOngoingDelivery: Joi.object().keys({
    query: {
      page: Joi.number().integer().min(1).label('Page').required(),
      search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
    },
    body: {
      searchDate: Joi.date().format('DD-MM-YYYY')
        .timestamp('unix')
        .label('Date').options({
          convert: true,
          language: {
            any: {
              format: 'should be a valid format (DD-MM-YYYY)',
            }
          }
        }).optional()
    }
  }),

  //  joi pending SO
  joiPendingDelivery: Joi.object().keys({
    query: {
      page: Joi.number().integer().min(1).label('Page').required(),
      search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
    },
    body: {
      searchDate: Joi.date().format('DD-MM-YYYY')
        .timestamp('unix')
        .label('Date').options({
          convert: true,
          language: {
            any: {
              format: 'should be a valid format (DD-MM-YYYY)',
            }
          }
        }).optional()
    }
  }),

  //  joi History SO
  joiHistoryOfSO: Joi.object().keys({
    page: Joi.number().integer().min(1).label('Page').required(),
    search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
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

  // joi customer get 
  joiStartPickSalesOrder: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiStartPickSalesOrder;
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
  joiSalesOrderDetails: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesOrderDetails;
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

  // joi Scan SalesOrder
  joiScanSalesOrder: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiScanSalesOrder;
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

  // joi view order basket
  joiViewOrderBasket: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiViewOrderBasket;
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
  // joi Customer get details
  joiCustomerGetDetails: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiCustomerGetDetails;
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

  // joi on-going list 
  joiOngoingDelivery: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiOngoingDelivery;
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

  //  joi pending SO
  joiPendingDelivery: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiPendingDelivery;
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


  //  joi History SO
  joiHistoryOfSO: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiHistoryOfSO;
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
