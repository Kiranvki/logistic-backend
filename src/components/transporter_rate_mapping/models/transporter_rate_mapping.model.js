const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const transporterRateMapping = new Schema({
  'transporterId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transporterVehicle',

  },
  'ratecategoryId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rateCategoryModel',
  },
  'createdBy': {
    type: String,
  },

  'isDeleted': {
    type: Number,
    default: 0
  },
  'status': {
    type: Number,
    default: 1
  },

}, {
  timestamps: true
});

invoicePickerBoySalesOrderMapping.index({
  'transporterId': 1,
  'ratecategoryId': 1
});

// exporting the entire module
module.exports = mongoose.model('transporterRateMapping', transporterRateMapping);