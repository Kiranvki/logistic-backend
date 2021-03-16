const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const vehicleModelMaster = new Schema({

  'name': {
    type: String,
    required: true
  },
  'brand': {
    type: String,
    required: true
  },
  'tonnage': {
    type: String,
    required: true
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

// vehicleModelMaster.index({
//   'name': 1,
//   'brand': 1
// },{unique: true});

// exporting the entire module
module.exports = mongoose.model('vehicleModelMaster', vehicleModelMaster);