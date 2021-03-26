// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../../responses/response');

// add joi schema 
const schemas = {
  

  // joi apicker boy start recieving
  startRecieving: Joi.object().keys({
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
  // joi recieving list after doing start pick or for resuming reciving po
  joiRecievingList: Joi.object().keys({
    poRecievingId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Purchase order  recieving Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    })
  }),
  // joi add recieved item to cart
  joiRecievingItem: Joi.object().keys({
    params:{
      itemId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Purchase order recieving item Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    })
  },
  body:{
    poRecievingId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Purchase order recieving Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    }),
    recievedQty:Joi.number().integer().min(0).label('Recieved quantity').required()
  },
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
  startRecieving: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.startRecieving;
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

  joiRecievingList: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiRecievingList;
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
  joiRecievingItem: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiRecievingItem;
    let option = options.basic;

    // validating the schema 
    schema.validate({params:req.params, body:req.body}, option).then(() => {
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
