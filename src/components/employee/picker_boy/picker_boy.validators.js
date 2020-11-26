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
  joiZohoDetails: Joi.object().keys({
    empId: Joi.string().trim().label('emp id').required().max(12),
  }),

  // create a new salesman
  joiPickerBoyCreate: Joi.object().keys({
    empId: Joi.string().trim().label('emp id').optional().allow('').max(12),
    isWaycoolEmp: Joi.boolean().label('Is Waycool Employee').required(),
    agencyId: Joi.string().trim().label('Agency Id').when('isWaycoolEmp', {
      is: true,
      then: Joi.optional().allow(''),
      otherwise: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required().options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id'
            }
          }
        }
      })
    }),
    city: Joi.string().trim().lowercase().label('city').required().valid(['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']),
    profilePic: Joi.string().trim().label('Profile Pic').optional().allow('').regex(/^[a-fA-F0-9]{24}$/).options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id'
          }
        }
      }
    }),
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
    reportingManagerId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Reporting Manager Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id'
          }
        }
      }
    }),
    gender: Joi.string().trim().lowercase().valid(['male', 'female', 'transgender']).optional().allow('')
  }),

  // get salesman list
  joiSalesmanList: Joi.object().keys({
    page: Joi.number().integer().min(1).label('Page').required(),
    search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
    type: Joi.string().trim().valid(['mapped', 'unmapped']).optional().default('mapped'),
    status: Joi.string().trim().lowercase().valid(['active', 'inactive']).optional().allow(''),
  }),

  // get joi salesman list for filter
  joiSalesmanListForFilter: Joi.object().keys({
    search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
  }),

  // get salesman's onboarded customers list
  joiSalesmanOnboardedCustomersList: Joi.object().keys({
    query: {
      page: Joi.number().integer().min(1).label('Page').required(),
      search: Joi.string().trim().lowercase().label('Search Query').optional().allow(''),
    },
    params: {
      salesmanId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Salesman Id').optional().allow('').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id'
            }
          }
        }
      }),
    }
  }),

  // joi saleman details 
  joiPickerBoyGetDetails: Joi.object().keys({
    pickerBoyId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('PickerBoy Id').required().options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id.'
          }
        }
      }
    })
  }),

  // joi salesman change status
  joiSalesmanChangeStatus: Joi.object().keys({
    salesmanId: Joi.string().trim().label('Salesman Id').required(),
    type: Joi.string().trim().valid(['activate', 'deactivate']).label('Type').required()
  }),

  // joi in in params
  joiIdInParams: Joi.object().keys({
    salesmanId: Joi.string().trim().label('Salesman Id').required(),
  }),

  // joi salesman patch 
  joiSalesmanPatch: Joi.object().keys({
    params: {
      salesmanId: Joi.string().trim().label('Salesman Id').required(),
    },
    body: Joi.object({
      contactMobile: Joi.string().trim().regex(/^[6-9]{1}[0-9]{9}$/).label('Contact Number').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid Phone Number'
            }
          }
        }
      }).optional().allow(''),
      email: Joi.string().email().trim().label('email').optional().max(256).allow(''),
      profilePic: Joi.string().trim().label('Profile Pic').optional().allow('').regex(/^[a-fA-F0-9]{24}$/).options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id'
            }
          }
        }
      }),
      reportingManagerId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Reporting Manager Id').optional().allow('').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id'
            }
          }
        }
      }),
    }).min(1)
  }),

  // joi salesman asm bulk mapping 
  joiSalesmanAsmBulkMapping: Joi.object().keys({
    salesmanIds: Joi.array().items(Joi.string().trim().label('Salesman Id').required()).min(1),
    reportingManagerId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Reporting Manager Id').optional().allow('').options({
      language: {
        string: {
          regex: {
            base: 'should be a valid mongoose Id'
          }
        }
      }
    }),
  }),

  // joi salesman report validation 
  joiSalesmanReport: Joi.object().keys({
    dates: Joi.array().items(Joi.date().format('DD/MM/YYYY').options({
      convert: true,
      language: {
        any: {
          format: 'should be a valid format'
        }
      }
    })).unique().min(1).required().label("Dates"),
  }),

  // joi salesman report download
  joiSalesmanReportDownload: Joi.object().keys({
    query: {
      type: Joi.string().trim().valid(['pdf', 'csv']).required()
    },
    body: {
      dates: Joi.array().items(Joi.date().format('DD/MM/YYYY').options({
        convert: true,
        language: {
          any: {
            format: 'should be a valid format'
          }
        }
      })).unique().min(1).required().label("Dates"),
    }
  }),

  // joi salesman detailed report 
  joiSalesmanReportDetails: Joi.object().keys({
    params: {
      salesmanId: Joi.string().trim().regex(/^[a-fA-F0-9]{24}$/).label('Salesman Id').optional().allow('').options({
        language: {
          string: {
            regex: {
              base: 'should be a valid mongoose Id'
            }
          }
        }
      }),
    },
    body: {
      dates: Joi.array().items(Joi.date().format('DD/MM/YYYY').options({
        convert: true,
        language: {
          any: {
            format: 'should be a valid format'
          }
        }
      })).unique().min(1).required().label("Dates"),
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

  // exports validate get zoho details 
  joiZohoDetails: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiZohoDetails;
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

  // create a new salesman
  joiPickerBoyCreate: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiPickerBoyCreate;
    let option = options.basic;

    // replacing space with - 
    req.body.contactMobile = req.body.contactMobile.replace(/\s/g, '-')

    let contactArray = req.body.contactMobile.split('-');

    if (contactArray.length > 1) {
      req.body.contactMobile = contactArray[1];
    } else req.body.contactMobile = contactArray[0];

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

  // get salesman list 
  joiSalesmanList: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesmanList;
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

  // get the salesman onboarded customers list
  joiSalesmanOnboardedCustomersList: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesmanOnboardedCustomersList;
    let option = options.basic;

    // validating the schema 
    schema.validate({ query: req.query, params: req.params }, option).then(() => {
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

  // get the salesman list for filters 
  joiSalesmanListForFilter: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesmanListForFilter;
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

  // joi PickerBoy details
  joiPickerBoyGetDetails: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiPickerBoyGetDetails;
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

  // joi salesman status change 
  joiSalesmanChangeStatus: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesmanChangeStatus;
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

  // joi id in params
  joiIdInParams: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiIdInParams;
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

  // joi salesman patch function 
  joiSalesmanPatch: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesmanPatch;
    let option = options.basic;

    // replacing space with - 
    if (req.body.contactMobile) {
      req.body.contactMobile = req.body.contactMobile.replace(/\s/g, '-')

      // splitting as per - 
      let contactArray = req.body.contactMobile ? req.body.contactMobile.split('-') : [];

      if (contactArray.length > 1) {
        req.body.contactMobile = contactArray[1];
      } else if (req.body.contactMobile) req.body.contactMobile = contactArray[0];
    }

    // validating the schema 
    schema.validate({ params: req.params, body: req.body }, option).then(() => {
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

  // joi salesman asm bulk mapping 
  joiSalesmanAsmBulkMapping: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesmanAsmBulkMapping;
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

  // get salesman report 
  joiSalesmanReport: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesmanReport;
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

  // get salesman report download 
  joiSalesmanReportDownload: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesmanReportDownload;
    let option = options.basic;

    // validating the schema 
    schema.validate({
      query: req.query,
      body: req.body
    }, option).then(() => {
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

  // get salesman details report 
  joiSalesmanReportDetails: (req, res, next) => {
    // getting the schemas 
    let schema = schemas.joiSalesmanReportDetails;
    let option = options.basic;

    // validating the schema 
    schema.validate({
      params: req.params,
      body: req.body
    }, option).then(() => {
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