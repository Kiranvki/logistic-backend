const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const autopopulate = require("mongoose-autopopulate");
const autoIncrement = require("mongoose-sequence")(mongoose);

// schema
const stockTransferInGRN = new Schema(
  {
    po_number: {
      type: String,
    },
    delivery_no: {
      type: String,
    },
    stiReceivingId: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "stocktransferinreceivingdetails",
    },
    sapGrnNo: {
      type: String,
    },
    grnNo: {
      type: String,
    },
    document_date: {
      type: String,
    },
    status: {
      type: Number,
      default: 1,
    },
    receivingStatus: {
      type: Number,
      default: 0,
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
    grnSequence: {
      type: Number,
    },
    supplierDetails: {
      supply_plant_city: {
        type: String,
      },
      supply_plant_name: {
        type: String,
      },
    },
    picking_date: {
      type: String,
    },
    picking_date_array: [
      {
        type: String,
      },
    ],
    remarks: {
      type: String,
    },
    timeStamp: {
      type: String,
    },
    locationId: {
      type: Number,
    },
    grnNo: {
      type: String,
    },
    stiVendorNumber: {
      type: String,
    },
    stiVendorDate: {
      type: String,
    },
    discount: {
      type: Number,
    },
    totalTaxAmount: {
      type: Number,
    },
    stiAmount: {
      type: Number,
    },
    netTotal: {
      type: Number,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isDeleted: {
      type: Number,
      default: 0,
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
//Stipulate User Name for Stage Verification
stockTransferInGRN.plugin(autopopulate);

// Mongoose Auto Increement
stockTransferInGRN.plugin(autoIncrement, {
  inc_field: "grnSequence",
});

stockTransferInGRN.index({});

// exporting the entire module
module.exports = mongoose.model("stocktransferinGRN", stockTransferInGRN);
