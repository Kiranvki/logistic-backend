// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response')



const schemas = {
    getTripDetailVal: Joi.object().keys({
        type: Joi.string().trim().label('type').valid('salesorders', 'salesOrders','spotSales', 'spotsales').options({
            language: {
              string: {
                regex: {
                  base: 'should be a valid type'
                }
              }
            }
          }).required(),
        tripid: Joi.string().trim().label('tripid').required().max(20)
      
    }),
    getOrderDetailVal: Joi.object().keys({
      type: Joi.string().trim().label('type').valid('salesorders', 'salesOrders','spotSales', 'spotsales').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid type'
            }
          }
        }
      }).required(),
        order: Joi.string().trim().label('orderid').required().max(20)
      
    }),
    updateOrderDetailVal: Joi.object().keys({
      type: Joi.string().trim().label('type').valid('salesorders', 'salesOrders','spotSales', 'spotsales').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid type'
            }
          }
        }
      }).required(),
        orderid: Joi.string().trim().label('orderid').required().max(20),
        itemRemarks:Joi.array().items(Joi.string()).required()
      
    }),

    generateGpnVal: Joi.object().keys({
      type: Joi.string().trim().label('type').valid('salesorders', 'salesOrders','spotSales', 'spotsales').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid type'
            }
          }
        }
      }).required(),
        tripid: Joi.string().trim().label('tripid').required().max(20),
        soid:Joi.string().trim().label('soid').required().max(20),
        
      
    }),
    getInvoice:Joi.object().keys({
      invoiceno: Joi.string().allow(''),
      invoiceid: Joi.when('invoiceno', { is: '', then: Joi.string(), otherwise: Joi.string().allow('') })
    }).or('invoiceno', 'invoiceid'),
    
    
    
    
    // Joi.object().keys({
    //     invoiceno:Joi.string().trim().label('invoiceno').max(20),
    //     invoiceid:Joi.string().trim().label('invoiceid').max(20)
        
    // }),
    updateOdometerReadingVal: Joi.object().keys({
        odometerreading:Joi.number().label('odometerreading').required(),
        // string().regex(/\d{1,2}[\,\.]{1}/).required(),
        tripid: Joi.number().label('tripid').required().min(1),
    }),
    getHistoryVal:Joi.object().keys({
      type: Joi.string().trim().label('type').valid('salesorders', 'salesOrders','spotSales', 'spotsales').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid type'
            }
          }
        }
      }).required()
    }),
    updateDeliveryStatusVal:Joi.object().keys({
      
      type: Joi.string().trim().label('type').valid('salesorders', 'salesOrders','spotSales', 'spotsales').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid type'
            }
          }
        }
      }).required()
  ,
          orderid:Joi.string().trim().required().min(18),
          crateout:Joi.number().integer().label('Caret out').required(),
          crateoutwithitem:Joi.number().integer().label('Caret out with item').required(),
          itemdata:Joi.array().items(
            Joi.object({
               id:Joi.string().trim().label('id').required().min(18),
               itemdeliverystatus:Joi.number().label('Delivery Status').integer().required(),
               rejectedquantity:Joi.number().label('Rejected item quantity').integer().required(),
               comments:Joi.string().trim().label('Comments').required().min(30)
            })

          ).required()
    })

};

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
    getTripByIdVal: (req, res, next) => {
        // getting the schemas 
        let schema = schemas.getTripDetailVal;
        let option = options.basic;

        // validating the schema 
        schema.validate({'type':req.params.type,'tripid':req.params.tripid}, option).then(() => {
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
    getOrderDetailVal: (req, res, next) => {
      // getting the schemas 
      let schema = schemas.getOrderDetailVal;
      let option = options.basic;

      // validating the schema 
      schema.validate({'type':req.params.type,'tripid':req.params.orderid}, option).then(() => {
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
  updateOrderStatusVal: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.updateOrderDetailVal;
    let option = options.basic;

    // validating the schema 
    schema.validate({'type':req.params.type,'tripid':req.params.orderid,...req.body}, option).then(() => {
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
getInvoiceVal: (req, res, next) => {
  // getting the schemas 
  let schema = schemas.getInvoice;
  let option = options.basic;

  // validating the schema 
  schema.validate({'invoiceno':req.query.invoiceno,'invoiceid':req.query.invoiceid}, option).then(() => {
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
updateOdometerReadingVal: (req, res, next) => {
  // getting the schemas 
  let schema = schemas.updateOdometerReadingVal;
  let option = options.basic;
 
  // validating the schema 
  schema.validate({'tripid':req.params.tripid,'odometerreading':req.body.odometerreading}, option).then(() => {
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
getInTripVal: (req, res, next) => {
  // getting the schemas 
  let schema = schemas.getHistoryVal;
  let option = options.basic;
 
  // validating the schema 
  schema.validate({'type':req.params.type}, option).then(() => {
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
getHistoryVal: (req, res, next) => {
  // getting the schemas 
  let schema = schemas.getHistoryVal;
  let option = options.basic;
 
  // validating the schema 
  schema.validate({'type':req.params.type}, option).then(() => {
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

updateDeliveryStatusVal:(req, res, next) => {
  // getting the schemas 
  let schema = schemas.updateDeliveryStatusVal;
  let option = options.basic;
 
  // validating the schema 
let requestObj = {
  'type':req.params.type,
  'orderid':req.params.id,
'crateout':req.body.crateout,
'crateoutwithitem':req.body.crateoutwithitem,
'itemdata':req.body.itemdata
}

  schema.validate(requestObj, option).then(() => {
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


