const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const invoicePickerBoySalesOrderMapping = new Schema({
  'pickerBoySalesOrderMappingId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoySalesOrderMapping',

  },
  'invoiceId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'invoiceMaster',
  },
  'salesOrderId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'invoiceMaster',
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
  'pickerBoySalesOrderMappingId': 1,
  'invoiceId': 1
});

// exporting the entire module
module.exports = mongoose.model('invoicePickerBoySalesOrderMapping', invoicePickerBoySalesOrderMapping);