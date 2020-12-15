const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/transporter_master.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;


// getting the model 
class newVehicleController extends BaseController {
    // constructor 
    constructor() {
      super();
      this.messageTypes = this.messageTypes.transporterMaster;
    }

     // create a new entry
  post = async (req, res) => {
    try {
      //Initializing the field

      info('New Vehicle Controller !');

      // // creating data to insert
      // let dataToInsert = {
      //   'transporterName': req.body.transporterName,
      //   'regNumber': req.body.regNumber,
      //   'vehicleType': req.body.vehicleType,
      //   'vehicleModel': req.body.vehicleModel,
      //   'length': req.body.length,
      //   'breadth': req.body.breadth
      // }
        
      // inserting data into the db 
      let isInserted = await Model.create({
        ...req.body
      });


      // // inserting data into the db 
      // let isInserted = await Model.create(dataToInsert);

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.newVehicleCreated);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.newVehicleNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


    // get details 
    getNewVehicle = async (req, res) => {
        try {
          info('Vehicle GET DETAILS !');
    
          // inserting data into the db 
          // let transporter = await Model.findOne({
          let vehicle = await Model.findById({
    
            _id: mongoose.Types.ObjectId(req.params.transporterMasterid)
          }).lean();
    
          // check if inserted 
          if (vehicle && !_.isEmpty(vehicle)) return this.success(req, res, this.status.HTTP_OK, vehicle, this.messageTypes.vehicleFetched);
          else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.vehicleNotFetched);
    
          // catch any runtime error 
        } catch (err) {
          error(err);
          this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
      }
    
      // patch the request 
      patchNewVehicle = async (req, res) => {
          try {
            info('Vehicle STATUS CHANGE !');
    
            // inserting the new user into the db
          let isUpdated = await Model.update({
            _id: mongoose.Types.ObjectId(req.params.transporterMasterid),
          }, {
            $set: {
              ...req.body
            }
          })
           // is inserted 
          if (isUpdated && !_.isEmpty(isUpdated)) {
            // success response 
            isUpdated.password = undefined;
            return this.success(req, res, this.status.HTTP_OK, req.body, this.messageTypes.vehicleUpdated);
          } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.vehicleNotUpdated);
    
          // catch any runtime error 
        } catch (err) {
          error(err);
          this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
      }
    
      //Delete Transporter
    
      deleterNewVehicle = async (req, res) => {
        try {
          info('New Vehicle Delete!');
    
          // inserting the new user into the db
        let isUpdated = await Model.findByIdAndDelete({
          _id: mongoose.Types.ObjectId(req.params.transporterMasterid),
        }, {
          $set: {
            ...req.body
          }
        })
         // is inserted 
        if (isUpdated && !_.isEmpty(isUpdated)) {
          // success response 
          isUpdated.password = undefined;
          return this.success(req, res, this.status.HTTP_OK, req.body, this.messageTypes.vehicleDeleted);
        } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.vehicleNotDeleted);
    
        // catch any runtime error 
      } catch (err) {
        error(err);
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
      }
    }

}
  

// exporting the modules 
module.exports = new newVehicleController();