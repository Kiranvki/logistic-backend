const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// schema
const stockTransferInReceivingDetails = new Schema(
  {
    pickerBoyId: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "pickerBoy",
      autopopulate: {
        select: ["fullName", "employeeId"],
      },
    },
    receivingStatus: {
      type: Number,
      default: 4,
    },
    // 4 initiated Receiving
    // 3 added itms to receiving cart
    //2 if fullfillment status is partially fulfilled and  grn is generated
    //1 if fullfillment status is  fulfilled and  grn is generated
    fulfilmentStatus: {
      type: Number,
      default: 0,
    },
    //2 partially fulfilled
    //1 fullfilled
    status: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Number,
      default: 0,
    },
    stiId: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "stocktransferin",
    },
    receivingDate: {
      type: Date,
    },
    item: [
      {
        higher_level_item: {
          type: String,
        },
        po_item: {
          type: String,
        },
        delivery_item_no: {
          type: String,
        },
        receiving_plant: {
          type: String,
        },
        status: {
          type: String,
        },
        material: {
          type: String,
        },
        material_description: {
          type: String,
        },
        delivery_quantity: {
          type: Number,
        },
        uom: {
          type: String,
        },
        pending_qty: {
          type: Number,
        },
        received_qty: {
          type: Number,
          default: 0,
        },
        is_edited: {
          type: Number,
        },
        remarks: {
          type: String,
        },
        date_of_manufacturing: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

stockTransferInReceivingDetails.index({});

// exporting the entire module
module.exports = mongoose.model(
  "stocktransferinreceivingdetails",
  stockTransferInReceivingDetails
);
