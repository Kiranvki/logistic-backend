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
  joiTallySync: Joi.object().keys({
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
    contactMobile: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Contact Number').options({
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
    page: Joi.number().integer().min(1).label('Page').required(),
    search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
  })
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
