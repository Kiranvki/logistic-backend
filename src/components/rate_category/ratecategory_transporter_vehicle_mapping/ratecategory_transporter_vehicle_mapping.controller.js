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


  // delete mapping function
  deleteMapping = async (mappingIdData) => {
    try {
      info('Rate category Vehicle Tranporter  Delete !');

      // creating data to insert
      let dataToUpdate = {
        $set: {
          status: 0,
          isDeleted: 1
        }
      };

      // checking mappingIdData object
      if (mappingIdData && !_.isEmpty(mappingIdData)) {
        let { rateCategoryId, transporterId, vehicleId } = mappingIdData
        // inserting data into the db 
        return await Model.findOneAndUpdate({
          transporterId: mongoose.Types.ObjectId(rateCategoryId),
          vehicleId: mongoose.Types.ObjectId(transporterId),
          rateCategoryId: mongoose.Types.ObjectId(vehicleId),
        }, dataToUpdate, {
          new: true,
          upsert: false,
          lean: true
        })
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

