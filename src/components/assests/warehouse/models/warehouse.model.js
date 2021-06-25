const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
require('mongoose-type-email');
const Schema = mongoose.Schema;

// schema
const warehouses = new Schema({
  cityId: {
    type: 'String',
    enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore', 'tiruppur', 'chittur', 'madurai', 'tirunelveli', 'chengalpatu', 'ranipet', 'erode3', 'karur', 'dindugal', 'salem']
  },
  name: {
    type: String,
    required: true
  },
  nameToDisplay: {
    type: String,
    required: true
  },
  latitude: {
    type: 'Number'
  },
  longitude: {
    type: 'Number'
  },
  location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
    },
    coordinates: {
      type: [Number],
    },
  },
  street: {
    type: String,
  },
  pincode: {
    type: 'Number'
  },
  status: {
    type: Number,
    default: 1,
    enum: [0, 1]
  },
  locationId: {
    type: String
  },
  isDeleted: {
    type: Number,
    default: 0,
    enum: [0, 1]
  },
  gstin: {
    type: String,
  },
  fssai: {
    type: String,
  },
  city: {
    type: String,
  },
  street: {
    type: String,
  },
  houseNumber: {
    type: String,
  },
  country: {
    type: String,
  },
  region: {
    type: String,
  },
  cin: {
    type: String,
  },
  
}, {
  timestamps: true
});

// creating indexes
warehouses.index({
  'name': 1,
  'status': 1
});

warehouses.plugin(autopopulate);

// exporting the entire module
module.exports = mongoose.model('warehouses', warehouses);