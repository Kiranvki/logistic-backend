const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/transporter_master_mapping.model')
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

//getting the model
class transporterMasterMappingController extends BaseController{
    // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.transporte;
  }

    // internal function to create invoice and  picker_salesorder mapping
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


  
  // Internal Function to get the invoice details
  getInvoiceDetails = async (transporterId) => {
    try {
      info('Get the Invoice  Details !');

      let invoiceData = await Model.aggregate([{
        $match: {
          'transporterId': mongoose.Types.ObjectId(transporterId)
        }
      },
      {
        $project: {
          'transporterMasterId': 1
        }
      },
      {
        $lookup: {
          from: 'transporterMaster',
          localField: "transporterMasterId",
          foreignField: "_id",
          as: 'vehicleDetails'
        }
      },
      ])

      // check if inserted 
      if (invoiceData && !_.isEmpty(invoiceData)) {
        return {
          success: true,
          data: data
        }
      } else {
        error('Error while getting the invoice data from pickerboy salesorder mapping id !');
        return {
          success: false
        }
      }
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
module.exports = new transporterMasterMappingController();