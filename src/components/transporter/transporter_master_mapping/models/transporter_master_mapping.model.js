const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const transporterMasterMapping = new Schema({
  'transporterId': {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transporter',
    required: true
  },
  'transporterMasterId': {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transporterMaster',
    required: true
  },
  status: {
    type: Number,
    default: 1,
  },
  isDeleted: {
    type: Number,
    default: 0,
    enum: [0, 1]
  }
}, {
  timestamps: true
});


// creating index
transporterMasterMapping.index({
  'transporterId': 1,
  'transporterMasterId': 1
});

// exporting the entire module
module.exports = mongoose.model('transporterMasterMapping', transporterMasterMapping);