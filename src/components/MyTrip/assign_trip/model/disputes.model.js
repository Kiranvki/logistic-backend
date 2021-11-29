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
    // 'invoiceNo': { //invoice_no
    //   type: 'String',
    // },
    material_description: {
      type: String,
    },

    itemId: {
      type: Number,
    },

    acceptedQty: {
      type: Number,
    },

    checkedQty: {
      type: Number,
      default: 0,
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

    // notifiedId: {
    //   type: String,
    // },

  isAccepted: {
    type: Number,
    default: 0, 
    enum: [0, 1,2] //// o for pending and 1 for accepted , 2 for rejected
  },

    status: {
      type: Number,
      default: 0,
      enum: [0, 1, 2, 3],
    },
  },
  { timestamps: true }
);

let disputeModel = mongoose.model("disputes", disputeSchema, "disputes");
module.exports = disputeModel;
