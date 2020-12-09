const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/new_transporter.model')
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

class newTransporterController extends BaseController{
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
      info('New Transporter Controller !');

      // creating data to insert
      let dataToInsert = {
        'transporterName': req.body.transporterName,
        'vechContactNumber': req.body.contactNumber,
        'alternateContactNumber': req.body.alternateContactNumber,
        'email': req.body.email,
        'alternateEmail': req.body.alternateEmail,
        'streetNo': req.body.streetNo,
        'address' : req.body.address,
        'city' : req.body.city,
        'country' : req.body.country,
        'postalCode' : req.body.postalCode,
        'contactPersonName' : req.body.contactPersonName,
        'contactNumber' : req.body.contactNumber,
        'alternativeContactNumber' : req.body.alternativeContactNumber,
        'emailID' : req.body.emailID,
        'alternativeEmailID' : req.body.alternativeEmailID,
      }

      // inserting data into the db 
      let isInserted = await Model.create(dataToInsert);

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.newTransporterCreated);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.newTransporterNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


    // get details 
    getnewTransporter = async (req, res) => {
        try {
          info('Transporter GET DETAILS !');
    
          // inserting data into the db 
          // let transporter = await Model.findOne({
          let new_transporter = await Model.findById({
    
            _id: mongoose.Types.ObjectId(req.params.newtransporterid)
          }).lean();
    
          // check if inserted 
          if (new_transporter && !_.isEmpty(new_transporter)) return this.success(req, res, this.status.HTTP_OK, new_transporter, this.messageTypes.newTransporterFetched);
          else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.newTransporterNotFetched);
    
          // catch any runtime error 
        } catch (err) {
          error(err);
          this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
      }

  // patch the request 
  patchNewTransporter = async (req, res) => {
    try {
      info('TRANSPORTER STATUS CHANGE !');

      // inserting the new user into the db
    let isUpdated = await Model.update({
      _id: mongoose.Types.ObjectId(req.params.newtransporterid),
    }, {
      $set: {
        ...req.body
      }
    })
     // is inserted 
    if (isUpdated && !_.isEmpty(isUpdated)) {
      // success response 
      isUpdated.password = undefined;
      return this.success(req, res, this.status.HTTP_OK, req.body, this.messageTypes.newTransporterUpdated);
    } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.newTransporterNotUpdated);

    // catch any runtime error 
  } catch (err) {
    error(err);
    this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  }
}

//Delete Transporter

deleteNewTransporter = async (req, res) => {
  try {
    info('Transporter Delete!');

    // inserting the new user into the db
  let isUpdated = await Model.findByIdAndRemove({
    _id: mongoose.Types.ObjectId(req.params.newtransporterid),
  }, {
    $set: {
      ...req.body
    }
  })
   // is inserted 
  if (isUpdated && !_.isEmpty(isUpdated)) {
    // success response 
    isUpdated.password = undefined;
    return this.success(req, res, this.status.HTTP_OK, req.body, this.messageTypes.newTransporterDeleted);
  } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.newTransporterNotDeleted);

  // catch any runtime error 
} catch (err) {
  error(err);
  this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
}
}
}
// exporting the modules 
module.exports = new newTransporterController();