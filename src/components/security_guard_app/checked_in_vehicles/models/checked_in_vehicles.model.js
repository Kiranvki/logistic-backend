const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// schema
const checkedInVehicles = new Schema(
  {
    vehicleNo: {
      type: String,
      required:true
    },
    driverName:{
      type: String,
    },
    tripId:{
      type: String,
      default: null
    },
    checkInTime:{
      type:Number
    },
    checkoutTime:{
      type:Number
    },
    isCheckedIn:{
      type: Boolean,   
    },
    isDeleted:{
      type:Number,
      default:0,
      enum:[0,1]
    }
  },
  {
    timestamps: true,
  }
);

// exporting the entire module
module.exports = mongoose.model('checkedInVehicles', checkedInVehicles);
