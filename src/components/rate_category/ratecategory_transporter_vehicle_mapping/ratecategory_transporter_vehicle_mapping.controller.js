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
      info('Creating vehicle transporter rateCategory Multiple Mapping (Array) !');

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

  createSingle = async (createObj) => {
    try {
      info('Creating vehicle transporter rateCategory Single Mapping !');

      // checking day object 
      if (createObj && !_.isElement(createObj)) {
        // creating the data inside the database 
        return Model
          .create(createObj)
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
  deleteMapping = async (rateCategoryVehicleTransporterMappingId) => {
    try {
      info('Rate category Vehicle Tranporter  Delete Internal Function !');

      // creating data to insert
      let dataToUpdate = {
        $set: {
          status: 0,
          isDeleted: 1
        }
      };

      // checking rateCategoryVehicleTransporterMappingId is present
      if (rateCategoryVehicleTransporterMappingId && !_.isEmpty(rateCategoryVehicleTransporterMappingId)) {

        // updating data into the db 
        return Model.findOneAndUpdate({
          _id: mongoose.Types.ObjectId(rateCategoryVehicleTransporterMappingId),
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


  // get valid and active Vehicle id from transporter id
  getValidAndActiveVehicleIdFromTransporterId = async (transporterId) => {
    try {
      info(`Get valid Vehicle IDs from transporter id ${transporterId}`);

      // creating the data inside the database 
      return Model
        .find({
          'transporterId': mongoose.Types.ObjectId(transporterId),
          'isDeleted': 0
        })
        .then((res) => {
          if (res)
            return {
              success: true,
              data: res.map((data) => data.vehicleId)
            };
          else return {
            success: false
          }
        });

      // catch any internal server error 
    } catch (err) {
      console.error(err);
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

