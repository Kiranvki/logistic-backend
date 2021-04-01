const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

// schema
const encryptedFiles = new Schema({
  encryptedKey: {
    type: String
  },
  IV: {
    type: String
  },
  encryptedFile: {
    type: String,
    required: true
  },
  encryptedFileThumb: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoy',

  },
  status: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

//Populate User Name for Stage Verification
encryptedFiles.plugin(autopopulate);

// creating indexes
encryptedFiles.index({
  'createdAt': 1,
  'status': 1
});

// pre conditions
encryptedFiles.pre('save', function (next) {
  this.encryptedKey = process.env.ENC_KEY;
  this.IV = process.env.IV;
  next();
});

// exporting the entire module
module.exports = mongoose.model('encryptedFiles', encryptedFiles);