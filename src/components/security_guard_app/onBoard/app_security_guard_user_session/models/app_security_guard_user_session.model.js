const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

// schema
const appPickerUserSession = new Schema({
  'pickerBoyId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoy',
    autopopulate: {
      select: ['fullName', 'employeeId']
    }
  },
  'cityId': {
    type: 'String',
    enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
  },
  'sessionKey': {
    type: String,
    required: true
  },

  'firebaseKey': {
    type: String
  },
  'loginDetails': [{
    'loggedInAt': {
      type: Date
    },
    'loginIp': {
      type: String,
      default: ''
    },
    'loginLocation': {
      'type': {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
        required: true
      },
      'coordinates': {
        type: [Number],
        required: true
      },
    },
  }],
  'otpSend': [{
    'otp': {
      type: String
    },
    'createdAt': {
      type: Date
    },
    'expiryInMin': {
      type: Number
    },
    'otpType': {
      type: String,
      enum: ['email', 'sms']
    },
    'requestId': {
      type: String,
    },
    'status': {
      type: Number,
      default: 0
    },
    'email': {
      type: String
    },
    'mobileNumber': {
      type: String
    }
  }],
  'status': {
    type: Number,
    default: 1
  },
  'isDeleted': {
    type: Number,
    default: 0
  },
}, {
  'timestamps': true
});

// creating indexes
appPickerUserSession.index({
  'pickerBoyId': 1,
  'loginLocation': 1
});

// updating the plugin 
appPickerUserSession.plugin(autopopulate);

// exporting the entire module
module.exports = mongoose.model('appPickerUserSession', appPickerUserSession);