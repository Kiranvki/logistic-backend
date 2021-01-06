const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// schema
const transporterVehiclerMapping = new Schema(
  {
    transporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transporter",
      //required: true
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vehicle",
      //required: true
    },
    createdBy: {
      type: String,
    },
    status: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
  },
  {
    timestamps: true,
  }
);

// creating index
transporterVehiclerMapping.index({
  regNumber: 1,
});

// exporting the entire module
module.exports = mongoose.model(
  "transporterVehiclerMapping",
  transporterVehiclerMapping
);
