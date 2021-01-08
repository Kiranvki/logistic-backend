const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

// schema
const deliveryExecutive = new Schema({ 
    employeeId: {
        type: String
      },
      employerName: {
        type: String,
        default: 'Waycool Foods & Products Private Limited'
      },
      isWaycoolEmp: {
        type: 'Boolean',
        default: false
      },
      reportingManager: {
        type: String,
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
      altContactNo: {
        type: Number,
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
      dateOfBirth: {
        type: Date
      },
    
      profilePic: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      createdBy: {
        type: String
      },
      createdById: {
        type: mongoose.Schema.Types.ObjectId,
      },
      cityId: {
        type: 'String',
        enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
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
    deliveryExecutive.index({
    'employeeId': 1
  });
// exporting the entire module
module.exports = mongoose.model('deliveryExecutive', deliveryExecutive);