// base joi 
const BaseJoi = require('joi');
// joi date extension 
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
// handling the joi response 
const Response = require('../../src/responses/response');

// add joi schema 
const schemas = {
  // check for valid user 
  joiCreate: Joi.object().keys({
    name: Joi.string().trim().label('name').required().min(1).max(256),
    city: Joi.string().trim().lowercase().valid(['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore', 'tiruppur', 'chittur', 'madurai', 'tirunelveli', 'chengalpatu', 'ranipet', 'erode3', 'karur', 'dindugal', 'salem']),
    latitude: Joi.number().optional().label('Latitude').allow(''),
    longitude: Joi.number().optional().label('Latitude').allow(''),
    street: Joi.string().required().label('Street'),
    pincode: Joi.number().integer().min(100000).max(999999).required().label('Pincode')
  }),

  // get list
  joiGetList: Joi.object().keys({
    page: Joi.number().integer().min(1).label('Page').required(),
    search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
  }),

  // joi update
  joiUpdate: Joi.object().keys({
    params: {
      warehouseId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Warehouse Id').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id.'
            }
          }
        }
      })
    },
    body: {
      name: Joi.string().trim().label('name').optional().min(1).max(256).allow(''),
      latitude: Joi.number().optional().label('Latitude').allow(''),
      longitude: Joi.number().optional().label('Latitude').allow(''),
      street: Joi.string().required().label('Street'),
      pincode: Joi.number().integer().min(100000).max(999999).required().label('Pincode'),
      locationId: Joi.string().trim().optional().allow(''),
    }
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

  // joi sign up validation
  joiCreate: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiCreate;
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

  // get agencies list 
  joiGetList: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiGetList;
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

  // joi warehouse update
  joiUpdate: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiUpdate;
    let option = options.basic;

    // validating the schema 
    schema.validate({ params: req.query, body: req.body }, option).then(() => {
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
