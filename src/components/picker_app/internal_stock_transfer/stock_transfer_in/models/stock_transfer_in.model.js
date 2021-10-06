const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// schema
// collection: stock_transfer_in
const stockTransferIn = new Schema(
  {
    po_number: {
      type: String,
    },
    delivery_no: {
      type: String,
    },
    "supply_plant":{
      type: String,
    },
    "receiving_plant": {
      type: String,
    },
    "supply_plant_name": {
      type: String,
    },
    "supply_plant_city": {
      type: String,
    },
    delivery_type: {
      type: String,
    },
    sapGrnNo: [
      {
        date: {
          type: String,
        },
        sapGrnNo: {
          type: String,
        },
        materialNoArray: [
          {
            type: String,
          },
        ],
        grnId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "stocktransferinGRN",
        },
        pickerBoyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "pickerBoy",
        },
      },
    ],

    status: {
      type: Number,
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
    //0 UNTOUCHED
    "picking_time": {
      type: String,
    },
    picking_date: {
      type: String,
    },
    picking_date_array: [
      {
        type: String,
      },
    ],
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
      },
    ],
  },
  {
    timestamps: true,
  }
);

stockTransferIn.index({});

// exporting the entire module
module.exports = mongoose.model(
  "stocktransferin",
  stockTransferIn,
  "stockTransferIn"
);
