const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const newVehicle = new Schema({
//   'pickerBoyId': {
//     required: true,
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'pickerBoy',
//     autopopulate: {
//       select: ['fullName', 'employeeId']
//     }
//   },

  'transporterName': {
    type: String,
  },
  'regNumbet': {
    type: Number,
  },
  'vehicleType': {
    type: String,
  },
  'vehicleModel': {
    type: Number,
  },
  'height': {
    type: Number,
  },
  'length': {
    type: Number,
  },
  'breadth': {
    type: Number,
  },

}, {
  timestamps: true
});

pickerBoySalesOrderMapping.index({
  'pickerBoyId': 1,
  'salesOrderId': 1
});

// exporting the entire module
module.exports = mongoose.model('newVehicle', newVehicle);