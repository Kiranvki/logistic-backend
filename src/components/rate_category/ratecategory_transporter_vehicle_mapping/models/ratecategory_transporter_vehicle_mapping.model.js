const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const ratecategoryTransporterVehicleMapping = new Schema({
  'transporterId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transporterMaster',
  },
  'rateCategoryId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rateCategoryModel',
  },
  'vehicleId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vehicleMaster',
  },
  'status': {
    type: Number,
    default: 0
  },
  'isDeleted': {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// creating indexes
ratecategoryTransporterVehicleMapping.index({
  'transporterId': 1,
  'ratecategoryId': 1,
  'vehicleId': 1,
  'status': 1,
  'createdAt': 1
});

// exporting the entire module
module.exports = mongoose.model('ratecategoryTransporterVehicleMapping', ratecategoryTransporterVehicleMapping);