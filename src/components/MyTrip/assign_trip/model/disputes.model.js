const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let disputeSchema = Schema(
  {
    tripId: {
      type: Number,
      unique: true,
      required: true,
    },
    disputeId: {
      type: Number,
      unique: true,
      required: true,
    },
    dispute_amount: {
      type: Number,
    },
    salesOrderId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "salesOrder",
      },
    ],
    invoiceId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "invoiceMaster",
      },
    ],
    material_description: {
      type: String,
    },
    itemId: {
      type: Number,
    },
    returnDetails: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        itemId: String,
        checkedQty: Number,
        reason: String,
      },
    ],

    notifiedId: {
      type: String,
      unique: true,
    },

  isAccepted: {
    type: Number,
    default: 0, 
    enum: [0, 1,2] // o for pending and 1 for accepted , 2 for rejected
  },
    isAccepted: {
      type: Number,
      default: 0, // 0 for rejected and 1 for accepted
      enum: [0, 1],
    },

    isPODReturned: {
      type: Number,
      default: 1, 
      enum: [0, 1], // 0 POD not returned,
    },

    status: {
      type: Number,
      default: 0,
      enum: [0, 1, 2],// 0 = dispute Raised, 1 = dispute Notified, 2 = dispute Resolved
    },
  },
  { timestamps: true }
);

let disputeModel = mongoose.model("disputes", disputeSchema, "disputes");
module.exports = disputeModel;
