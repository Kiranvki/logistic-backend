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
  startpicking: Joi.object().keys({
    STOID: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Purchase order Id")
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
  picking: Joi.object().keys({
    stoPickingId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Purchase order  receiving Id")
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

  bucketdetail: Joi.object().keys({
    stoPickingId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Purchase order  receiving Id")
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

  generateDelivery: Joi.object().keys({
    stoPickingId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Purchase order  receiving Id")
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

  generateInvoice: Joi.object().keys({
    stoPickingId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Purchase order  receiving Id")
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

  historyDetail: Joi.object().keys({
    stoPickingId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Purchase order  receiving Id")
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

  pendingOrderDetail: Joi.object().keys({
    stoPickingId: Joi.string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/)
      .label("Purchase order  receiving Id")
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
}

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
  joiStartpicking: (req, res, next) => {
    // getting the schemas
    let schema = schemas.startpicking;
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

  joiResumePicking: (req, res, next) => {
    // getting the schemas
    let schema = schemas.picking;
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

  joiPickingItem: (req, res, next) => {
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
  joiBucketdetail: (req, res, next) => {
    // getting the schemas
    let schema = schemas.bucketdetail;
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

  joiGenerateDelivery: (req, res, next) => {
    // getting the schemas
    let schema = schemas.generateDelivery;
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

  joiGenerateInvoice: (req, res, next) => {
    // getting the schemas
    let schema = schemas.generateInvoice;
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

  joiHistoryDetail: (req, res, next) => {
    // getting the schemas
    let schema = schemas.historyDetail;
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

  joiPendingOrderDetail: (req, res, next) => {
    // getting the schemas
    let schema = schemas.pendingOrderDetail;
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



