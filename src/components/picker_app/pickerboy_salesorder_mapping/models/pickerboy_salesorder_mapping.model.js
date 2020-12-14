const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const pickerBoySalesOrderMapping = new Schema({
  'pickerBoyId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoy',
    autopopulate: {
      select: ['fullName', 'employeeId']
    }
  },
date_field :{
 type: Date,
},
  'createdBy': {
    type: String,
  },
  'salesOrderId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'salesorder',
  },
  'state': {
    type: Number,
    default: 1,
    enum: [1, 2, 3]
    /**
     * state 1 : packing
     * state 2 : invoice generated
     * state 3 : on boarded to vehicle
     */
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

pickerBoySalesOrderMapping.index({
  'pickerBoyId': 1,
  'salesOrderId': 1
});

// exporting the entire module
module.exports = mongoose.model('pickerBoySalesOrderMapping', pickerBoySalesOrderMapping);