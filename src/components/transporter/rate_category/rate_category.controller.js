const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/rate_category.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;


// getting the model 
class rateCategoryController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.transporterMaster;
  }


  // create a new entry
  post = async (req, res) => {
    try {
      //Initializing the field
      //let TransporterMasterResult;
      info('Rate Category Controller !');

      // creating data to insert
      let dataToInsert = {
        'rateCategory': req.body.rateCategory,
        'type': req.body.type,
        'vehicle': req.body.vehicle,
        'vehicle_type': req.body.vehicle_type,
        'tonnage': req.body.tonnage,
        'expireOn': req.body.expireOn,
      }

      // inserting data into the db 
      let isInserted = await Model.create(dataToInsert);

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.rateCategoryCreated);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }



  //get rate Category
  getRateCategory = async (req, res) => {
    try {
      info('RATE CATEGORY GET DETAILS !');

      // inserting data into the db 
      // let transporter = await Model.findOne({
      let rateCategory = await Model.findById({

        _id: mongoose.Types.ObjectId(req.params.ratecategoryid)
      }).lean();

      // check if inserted 
      if (rateCategory && !_.isEmpty(rateCategory)) return this.success(req, res, this.status.HTTP_OK, rateCategory, this.messageTypes.rateCategoryFetched);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryNotFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  //patch Rate Category
  patchRateCategory = async (req, res) => {
    try {
      info('Rate Category STATUS CHANGE !');

      // inserting the new user into the db
      let isUpdated = await Model.update({
        _id: mongoose.Types.ObjectId(req.params.ratecategoryid),
      }, {
        $set: {
          ...req.body
        }
      })
      // is inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) {
        // success response 
        isUpdated.password = undefined;
        return this.success(req, res, this.status.HTTP_OK, req.body, this.messageTypes.rateCategoryUpdatedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryNotUpdatedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  //delete

  //  deleteTransporter = async (req, res) => {
  //   try {
  //     info('Rate Category Delete !');

  //     // transporter id  
  //     let ratecategoryid = req.params.ratecategoryid;

  //     // creating data to insert
  //     let dataToUpdate = {
  //       $set: {
  //         // status: 0,
  //         isDeleted: 1
  //       }
  //     };

  //     // inserting data into the db 
  //     let isUpdated = await Model.findByIdAndRemove({
  //       _id: mongoose.Types.ObjectId(ratecategoryid)
  //     }, dataToUpdate, {
  //       new: true,
  //       upsert: false,
  //       lean: true
  //     })

  //     // check if inserted 
  //     if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.rateCategoryDeletedSuccessfully);
  //     else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryNotDeletedSuccessfully);
  //     // catch any runtime error 
  //   } catch (err) {
  //     error(err);
  //     this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  //   }
  // }


  deleterateCategory = async (req, res) => {
    try {
      info('Rate Category Delete!');

      // inserting the new user into the db
      let isUpdated = await Model.findByIdAndRemove({
        _id: mongoose.Types.ObjectId(req.params.ratecategoryid),
      }, {
        $set: {
          ...req.body
        }
      })
      // is inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) {
        // success response 
        isUpdated.password = undefined;
        return this.success(req, res, this.status.HTTP_OK, req.body, this.messageTypes.rateCategoryDeletedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryNotDeletedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


}


// exporting the modules 
module.exports = new rateCategoryController();
