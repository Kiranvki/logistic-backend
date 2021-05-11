// base joi
const BaseJoi = require("joi");
// joi date extension
const Extension = require("joi-date-extensions");
const Joi = BaseJoi.extend(Extension);
// handling the joi response
const Response = require("../../../../responses/response");

// add joi schema
const schemas = {
  // joi zoho details
  joistiGenerateGRN: Joi.object().keys({
    params: {
      stiReceivingId: Joi.string()
        .trim()
        .regex(/^[a-fA-F0-9]{24}$/)
        .label("Stock Transfer IN receiving Id")
        .required()
        .options({
          language: {
            string: {
              regex: {
                base: "should be a valid mongoose Id.",
              },
            },
          },
        }),
    },
    body: {
      vendorInvoiceNumber: Joi.string()
        .trim()
        .label("Vendor Invoice Number")
        .required(),
    },
  }),

  // joi asm create
  joigrnId: Joi.object().keys({
    grnId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Stock Transfer IN GRN Id")
      .required()
      .options({
        language: {
          string: {
            regex: {
              base: "should be a valid mongoose Id.",
            },
          },
        },
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
  // exports validate admin signin
  joigrnId: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joigrnId;
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

  // joi asm create
  joistiGenerateGRN: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joistiGenerateGRN;
    let option = options.basic;

    // validating the schema
    schema
      .validate({ params: req.params, body: req.body }, option)
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
