// base joi
const BaseJoi = require("joi");
// joi date extension
const Extension = require("joi-date-extensions");
const Joi = BaseJoi.extend(Extension);
// handling the joi response
const Response = require("../../../responses/response");

// add joi schema
const schemas = {
  // get disputes list
  joiDisputesList: Joi.object().keys({
    page: Joi.number().integer().min(1).label("Page").required(),
    search: Joi.string()
      .trim()
      .lowercase()
      .label("Search Query")
      .optional()
      .allow(""),
  }),

  joiId: Joi.object().keys({
    id: Joi.number().integer().min(2).label("Id").required(),
  }),

  joiDisputeId: Joi.object().keys({
    disputeId: Joi.number().integer().min(2).label("dispute Id").required(),
  }),

  joiInvoiceNo: Joi.object().keys({
    invoiceId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Salesman Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    }),
  }),
};

// joi options
const options = {
  // generic option
  basic: {
    abortEarly: false,
    convert: true,
    allowUnknown: false,
    stripUnknown: true,
  },
  // Options for Array of array
  array: {
    abortEarly: false,
    convert: true,
    allowUnknown: true,
    stripUnknown: {
      objects: true,
    },
  },
};

module.exports = {
  // joi vehicle list
  joiDisputesList: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiDisputesList;
    let option = options.basic;

    // validating the schema
    schema
      .validate(req.query, option)
      .then(() => {
        next();
        // if error occured
      })
      .catch((err) => {
        let error = [];
        err.details.forEach((element) => {
          error.push(element.message);
        });

        // returning the response
        Response.joierrors(req, res, err);
      });
  },

  joiId: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiId;
    let option = options.basic;

    // validating the schema
    schema
      .validate(req.params, option)
      .then(() => {
        next();
        // if error occured
      })
      .catch((err) => {
        let error = [];
        err.details.forEach((element) => {
          error.push(element.message);
        });

        // returning the response
        Response.joierrors(req, res, err);
      });
  },

  joiInvoiceNo: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiInvoiceNo;
    let option = options.basic;

    // validating the schema
    schema
      .validate(req.params, option)
      .then(() => {
        next();
        // if error occured
      })
      .catch((err) => {
        let error = [];
        err.details.forEach((element) => {
          error.push(element.message);
        });

        // returning the response
        Response.joierrors(req, res, err);
      });
  },

  joiDisputeId: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiDisputeId;
    let option = options.basic;

    // validating the schema
    schema
      .validate(req.params, option)
      .then(() => {
        next();
        // if error occured
      })
      .catch((err) => {
        let error = [];
        err.details.forEach((element) => {
          error.push(element.message);
        });

        // returning the response
        Response.joierrors(req, res, err);
      });
  },
};
