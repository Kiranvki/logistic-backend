// base joi
const BaseJoi = require("joi");
// joi date extension
const Extension = require("joi-date-extensions");
const Joi = BaseJoi.extend(Extension);
// handling the joi response
const Response = require("../../../../responses/response");

// add joi schema
const schemas = {
  // joi apicker boy start receiving
  startReceiving: Joi.object().keys({
    stiId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Stock Transfer IN Id")
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
  // joi receiving list after doing start pick or for resuming reciving sti
  joiReceivingList: Joi.object().keys({
    stiReceivingId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Stock Transfer IN  receiving Id")
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
  // joi add received item to cart
  joiReceivingItem: Joi.object().keys({
    params: {
      material: Joi.string()
        .trim()
        .regex(/^[a-fA-F0-9]{24}$/)
        .label("Stock Transfer IN receiving item Id")
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
        stiId: Joi.string()
        .trim()
        .regex(/^[a-fA-F0-9]{24}$/)
        .label("Stock Transfer IN  Id")
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
      date_of_manufacturing: Joi.date().label("Manufacturing date").optional(), //to-do
      received_qty: Joi.number()
        .integer()
        .min(0)
        .label("Received delivery_quantity")
        .required(),
      remarks: Joi.string()
        .trim()
        .label("remarks")
        .valid(
          "Stock Quantity supplied is less",
          "Stock Quality not upto the mark"
        )
        .options({
          language: {
            string: {
              regex: {
                base: "should be a valid remark",
              },
            },
          },
        })
        .optional(),
    },
  }),
  // joi add received item to cart
  joiScanItem: Joi.object().keys({
    params: {
      material: Joi.string()
        .trim()
        .regex(/^[a-fA-F0-9]{24}$/)
        .label("Stock Transfer IN receiving item Id")
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
      date_of_manufacturing: Joi.date().label("Manufacturing date").optional(), //to-do
      remarks: Joi.string()
        .trim()
        .label("remarks")
        .valid(
          "Stock Quantity supplied is less",
          "Stock Quality not upto the mark"
        )
        .options({
          language: {
            string: {
              regex: {
                base: "should be a valid remark",
              },
            },
          },
        })
        .optional(),
    },
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
  startReceiving: (req, res, next) => {
    // getting the schemas
    let schema = schemas.startReceiving;
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

  joiReceivingList: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiReceivingList;
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
  joiReceivingItem: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiReceivingItem;
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
  joiScanItem: (req, res, next) => {
    // getting the schemas
    let schema = schemas.joiScanItem;
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
