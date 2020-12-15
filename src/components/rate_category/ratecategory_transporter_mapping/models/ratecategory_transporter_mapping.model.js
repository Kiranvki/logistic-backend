const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const ratecategoryTransporterMapping = new Schema({
  'transporterId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transporterMaster',
    // autopopulate: {
    //   select: ['distributorName']
    // }
  },
  'ratecategoryId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rateCategoryModel',
    // autopopulate: {
    //   select: ['name']
    // }
  },
  'status': {
    type: Number,
    default: 0
  },
  'isDeleted': {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// creating indexes
ratecategoryTransporterMapping.index({
  'transporterId': 1,
  'ratecategoryId': 1,
  'status': 1,
  'createdAt': 1
});

// exporting the entire module
module.exports = mongoose.model('ratecategoryTransporterMapping', ratecategoryTransporterMapping);