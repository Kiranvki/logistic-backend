const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const vehicleMaster = new Schema({

  'regNumber': {
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
  status: {
    type: Number,
    default: 1
},
isDeleted: {
    type: Number,
    default: 0
}
},
{
    timestamps: true
});

pickerBoySalesOrderMapping.index({
  'regNumber': 1
});

// exporting the entire module
module.exports = mongoose.model('vehicleMaster', vehicleMaster);