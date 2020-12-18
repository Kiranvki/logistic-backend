const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/transporter_vehicle_mapping.model')
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

//getting the model
class transporterMasterMappingController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.transporte;
  }

  // internal function to create invoice and  picker_salesorder mapping
  // create = async (createObj) => {
  //   try {
  //     info('Create Transporter and vehicle  Mapping !');

  //     // create a mapping for Transporter and  vehicle
  //     return Model.create(createObj)
  //       .then((res) => {
  //         if (res && !_.isEmpty(res))
  //           return {
  //             success: true,
  //             data: res
  //           };
  //         else return {
  //           success: false
  //         }
  //       }).catch((err) => {
  //         console.error(err);
  //         return {
  //           success: false,
  //           error: err
  //         }
  //       });

  //     // catch any runtime error 
  //   } catch (err) {
  //     error(err);
  //     return {
  //       success: false,
  //       error: err
  //     }
  //   }
  // }


  create = async (req, res) => {
    try {
      info('vehicle  Controller !');

      // creating data to insert
      let dataToInsert = {
        'regNumber': req.params.regNumber,
        'vehicleType': req.params.vehicleType,
        'vehicleModel': req.params.vehicleModel,
        'height': req.params.height,
        'length': req.params.length,
        'vehicleModel': req.params.vehicleModel,
        'breadth': req.params.breadth
      } 
console.log("dsdsf");
// inserting data into the db 
let isInserted = await Model.create(dataToInsert);

// check if inserted 
if (isInserted && !_.isEmpty(isInserted)) return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.roleCreated);
else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.roleNotCreated);

        // catch any runtime error 
      } catch (err) {
  error(err);
  this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
}
    }


// Internal Function to get the invoice details
getTransporterVehicle = async (transporterId) => {
  try {
    info('Get the Transporter Vahicle  Details !');

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
      error('Error while getting the transporter data from vehicle mapping id !');
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