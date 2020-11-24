const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const basicConfig = new Schema({
  configName: {
    type: String,
    required: true
  },
  configValue: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

basicConfig.index({
  'configName': 1,
});

// exporting the entire module
module.exports = mongoose.model('basicConfig', basicConfig);