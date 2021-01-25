const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
require('mongoose-type-email');
const Schema = mongoose.Schema;

// schema
const vehicleAttendance = new Schema({
  vehicleId: {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vehicleMaster',
    autopopulate: {
      select: ['vehicleType', 'regNumber', 'vehicleModel']
    }
  },
  dateOfAttendance: {
    type: Date,
    require: true
  },

  attendanceLog: [{
    checkInDate: {
      type: Date,
      unique: true,
      required: true
    },
    checkInTimeInMins: {
      type: Number,
      required: true
    },
    checkOutDate: {
      type: Date,
    },
    checkOutTimeInMins: {
      type: Number,
    },
    totalWorkingInMins: {
      type: Number
    },
    isCheckedOut: {
      type: Number,
      default: 0,
      enum: [0, 1]
    },
    createdDate: {
      type: Date,
      required: true,
    },
    driverName: {
      type: String,
      require: true
    },
    status: {
      type: Number,
      enum: [0, 1],
      default: 1
    }
  }],
  status: {
    type: Number,
    default: 1
  },
  isDeleted: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// creating indexes
vehicleAttendance.index({
  'vehicleId': 1,
  'dateOfAttendance': 1,
  'status': 1
});

// autopopulate 
vehicleAttendance.plugin(autopopulate);

// exporting the entire module
module.exports = mongoose.model('vehicleAttendance', vehicleAttendance);