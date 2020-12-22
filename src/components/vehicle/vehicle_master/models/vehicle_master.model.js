const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const vehicleMaster = new Schema({

  'regNumber': {
    type: String,
  },
  'vehicleType': {
    type: String,
  },
  'vehicleModel': {
    type: String,
  },
  'height': {
    type: String,
  },
  'length': {
    type: Number,
  },
  'breadth': {
    type: String,
  },
  'tonnage':{
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

vehicleMaster.index({
  'regNumber': 1
});

// exporting the entire module
module.exports = mongoose.model('vehicleMaster', vehicleMaster);