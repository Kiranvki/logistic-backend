const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

// schema
const securityGuard = new Schema({ 
    employeeId: {
        type: String
      },
      employerName: {
        type: String,
        default: 'Waycool Foods & Products Private Limited'
      },
      isWaycoolEmp: {
        type: Number,
        default: 1
      },
      email: {
        type: String,
        required: true
      },
      gender: {
        type: String,
      },
      aadharNumber: {
        type: String,
      },
      designation: {
        type: String
      },
      pan: {
        type: String
      },
      zohoId: {
        type: String
      },
      firstName: {
        type: String,
        required: true
      },
      lastName: {
        type: String,
        required: true
      },
      fullName: {
        type: String,
        required: true
      },
      contactMobile: {
        type: Number
      },
      photo: {
        type: String
      },
      role: {
        type: String
      },
      employeeStatus: {
        type: String
      },
      employeeType: {
        type: String
      },
      locationName: {
        type: String
      },
      dateOfJoining: {
        type: Date
      },
      reportingTo: {
        id: {
          type: String
        },
        name: {
          type: String
        },
        emailId: {
          type: String
        }
    },
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
    securityGuard.index({
    'employeeId': 1
  });
// exporting the entire module
module.exports = mongoose.model('securityGuard', securityGuard);