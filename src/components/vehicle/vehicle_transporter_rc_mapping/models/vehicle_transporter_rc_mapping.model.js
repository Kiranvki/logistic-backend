const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const vehicletransporterRcMapping = new Schema({

'vehicleId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vehicleMaster'
},
  'transporterId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transporters'
  },
  'vehicleModelId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vehicleModelMaster'
  },
  'rateCategoryId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rateCategoryModel'
  },
  'metaData': {
    type: Number,
  },
  'status': {
    type: Number,
    default: 1
  },
  'createdBy': {
    type: String,
  },
  'isDeleted': {
    type: Number,
    default: 0
  }
},
  {
    timestamps: true
  });

  vehicletransporterRcMapping.index({
  'transporterId': 1,
  'vehicleId':1,
  'rateCategoryId': 1,
  'vehicleModelId': 1
},{unique: true});

// exporting the entire module
module.exports = mongoose.model('vehicletransporterRcMapping', vehicletransporterRcMapping);