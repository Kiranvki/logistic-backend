const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/ratecategory_transporter_vehicle_mapping.model')
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

// getting the model 
class ratecategoryTransporterMappingCtrl extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.distributor;
  }


  // internal create function 
  // create function
  create = async (createObj) => {
    try {
      info('Creating vehicle transporter rateCategory Mapping !');

      // checking day object 
      if (createObj && createObj.length) {
        // creating the data inside the database 
        return Model
          .insertMany(createObj)
          .then((res) => {
            if (res)
              return {
                success: true,
              };
            else return {
              success: false
            }
          });
      } else return {
        success: false
      };

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

}

// exporting the modules 
module.exports = new ratecategoryTransporterMappingCtrl();

