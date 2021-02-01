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
    type: Number,
  },
  'length': {
    type: Number,
  },
  'breadth': {
    type: String,
  },
  'tonnage': {
    type: Number,
  },
  'status': {
    type: Number,
    default: 1
  },
  'isDeleted': {
    type: Number,
    default: 0
  },
  'cityId': {
    type: String,
  },
  'warehouseId': {
    //required: true,
    type: mongoose.Schema.Types.ObjectId,
  },
  rateCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rateCategoryModel'
  }

},
  {
    timestamps: true
  });

vehicleMaster.index({
  'regNumber': 1,
  'vehicleModel': 1
});

// exporting the entire module
module.exports = mongoose.model('vehicleMaster', vehicleMaster);