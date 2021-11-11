// base joi
const BaseJoi = require("joi");
// joi date extension
const Extension = require("joi-date-extensions");
const Joi = BaseJoi.extend(Extension);
// handling the joi response
const Response = require("../../../responses/response");

// add joi schema
const schemas = {
  // get vehicle list
  joiVehicleList: Joi.object().keys({
    page: Joi.number().integer().min(1).label("Page").required(),
    search: Joi.string()
      .trim()
      .lowercase()
      .label("Search Query")
      .optional()
      .allow(""),
  }),

  joiInvoiceNo: Joi.object().keys({
    invoiceNo: Joi.number().integer().required(),
  }),

  joiVehicleId: Joi.object().keys({
    vehicleId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Vehicle Id")
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

  joiTripId: Joi.object().keys({
    tripId: Joi.number().integer().min(2).label("tripId").required(),
  }),

  joiId: Joi.object().keys({
    salesorderId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("id")
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
  // joi vehicle list
  joiVehicleList: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiVehicleList;
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

  joiVehicleId: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiVehicleId;
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

  joiTripId: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiTripId;
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
};
