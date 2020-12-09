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
class transporterMasterController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.transporterMaster;
  }


  // create a new entry
  post = async (req, res) => {
       //let dataToInsert = new Model(req.body)

    try {
      //Initializing the field
      //let TransporterMasterResult;
      info('Transporter Master Controller !');

      // inserting data into the db 
      let isInserted = await Model.create({
        ...req.body
      });

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.transporterMasterCreated);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterMasterNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // get details 
  getTransporterMaster = async (req, res) => {
    try {
      info('Transporter GET DETAILS !');

      // inserting data into the db 
      // let transporter = await Model.findOne({
      let transporter = await Model.findById({

        _id: mongoose.Types.ObjectId(req.params.transporterid)
      }).lean();

      // check if inserted 
      if (transporter && !_.isEmpty(transporter)) return this.success(req, res, this.status.HTTP_OK, transporter, this.messageTypes.transporterMasterFetched);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterMasterNotFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // patch the request 
    patchTransporterStatus = async (req, res) => {
      try {
        info('TRANSPORTER STATUS CHANGE !');

        // inserting the new user into the db
      let isUpdated = await Model.update({
        _id: mongoose.Types.ObjectId(req.params.transporterid),
      }, {
        $set: {
          ...req.body
        }
      })
       // is inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) {
        // success response 
        isUpdated.password = undefined;
        return this.success(req, res, this.status.HTTP_OK, req.body, this.messageTypes.transporterMasterUpdated);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterMasterNotUpdated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  //Delete Transporter

  deleteTransporter = async (req, res) => {
    try {
      info('Transporter Delete!');

      // inserting the new user into the db
    let isUpdated = await Model.findByIdAndRemove({
      _id: mongoose.Types.ObjectId(req.params.transporterid),
    }, {
      $set: {
        ...req.body
      }
    })
     // is inserted 
    if (isUpdated && !_.isEmpty(isUpdated)) {
      // success response 
      isUpdated.password = undefined;
      return this.success(req, res, this.status.HTTP_OK, req.body, this.messageTypes.transporterDeleted);
    } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotDeleted);

    // catch any runtime error 
  } catch (err) {
    error(err);
    this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  }
}

}
// exporting the modules 
module.exports = new transporterMasterController();
