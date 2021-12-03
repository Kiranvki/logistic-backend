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

  joiTripId: Joi.object().keys({
    tripId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Trip Id")
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

  joiTripNo: Joi.object().keys({
    tripId: Joi.number().integer().min(2).label("tripId").required(),
  }),

  joiType:Joi.object().keys({
    type:Joi.string().valid("0","1").required(),
  })
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

  joiTripNo: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiTripNo;
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

  joiType: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiType;
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
