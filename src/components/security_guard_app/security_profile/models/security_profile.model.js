const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const securityProfileSchema = new Schema({
  'securityGuardId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'securityGuard',
    autopopulate: {
      select: ['fullName', 'employeeId']
    }
  },
  'securityDate': {
    type: Date,
  },
  'createdBy': {
    type: String,
  },
  'state': {
    type: Number,
    default: 1,
    enum: [1, 2, 3]
    /**
     * state 1 : packing
     * state 2 : invoice generated
     * state 3 : on boarded to vehicle
     */
  },
  'isDeleted': {
    type: Number,
    default: 0
  },
  'status': {
    type: Number,
    default: 1
  },

}, {
  timestamps: true
});

securityProfileSchema.index({
  'securityGuardId': 1
});

// exporting the entire module
module.exports = mongoose.model('securityProfileSchema', securityProfileSchema);