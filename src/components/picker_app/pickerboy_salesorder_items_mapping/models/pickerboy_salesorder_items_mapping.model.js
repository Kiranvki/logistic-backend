const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const pickerBoySalesOrderItemsMapping = new Schema({
  'pickerBoySalesOrderMappingId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoySalesOrderMapping',
  },
  'itemId': {
    required: true,
    type: Number,
  },
  'itemName': {
    type: String,
  },
  'quantity': {
    required: true,
    type: Number,
  },
  'suppliedQty': {
    required: true,
    type: Number,
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

pickerBoySalesOrderItemsMapping.index({
  'pickerBoySalesOrderMappingId': 1,
  'itemId': 1
});

// exporting the entire module
module.exports = mongoose.model('pickerBoySalesOrderItemsMapping', pickerBoySalesOrderItemsMapping);