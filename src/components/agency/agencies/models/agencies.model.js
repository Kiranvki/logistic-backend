const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
require('mongoose-type-email');
const Schema = mongoose.Schema;

// schema
const agencies = new Schema({
  name: {
    type: String,
    required: true
  },
  nameToDisplay: {
    type: String,
    required: true
  },
  cityId: {
    type: 'String',
    enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
  },
  status: {
    type: Number,
    default: 1,
    enum: [0, 1]
  },
  isDeleted: {
    type: Number,
    default: 0,
    enum: [0, 1]
  },
}, {
  timestamps: true
});

// creating indexes
agencies.index({
  'name': 1,
  'status': 1
});

agencies.plugin(autopopulate);

// exporting the entire module
module.exports = mongoose.model('agencies', agencies);