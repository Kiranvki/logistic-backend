const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/ratecategory_transporter_mapping.model')
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
  create = async (req, res) => {
    try {
      info('Create Distributor Brand Mapping !');

      // is inserted 
      let isInserted = await Model.create({
        ...req.body
      });

      if (isInserted && !_.isEmpty(isInserted)){
      return this.success(req, res, this.status.HTTP_OK, isInserted);
    } else return this.errors(req, res, this.status.HTTP_CONFLICT);

    // catch any runtime error 
  } catch (err) {
    error(err);
    this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  }
}

}

// exporting the modules 
module.exports = new ratecategoryTransporterMappingCtrl();

  