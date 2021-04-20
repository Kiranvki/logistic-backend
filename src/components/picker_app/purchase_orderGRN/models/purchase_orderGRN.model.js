const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const autopopulate = require("mongoose-autopopulate");
const autoIncrement = require("mongoose-sequence")(mongoose);

// schema
const purchaseOrderGRN = new Schema(
  {
    po_number: {
      type: String,
    },
    poReceivingId: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "purchaseorderreceivingdetails",
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
    vendorInvoiceNo: {
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
    sequence: {
      type: Number,
    },
    supplierDetails: {
      vendor_no: {
        type: String,
      },
      vendor_name: {
        type: String,
      },
    },
    delivery_date: {
      type: String,
    },
    delivery_date_array: [
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
    poVendorNumber: {
      type: String,
    },
    poVendorDate: {
      type: String,
    },
    discount: {
      type: Number,
    },
    totalTaxAmount: {
      type: Number,
    },
    poAmount: {
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
        item_no: {
          type: String,
        },
        plant: {
          type: String,
        },
        material_group: {
          type: String,
        },
        storage_location: {
          type: String,
        },
        tax_code: {
          type: String,
        },
        conversion_factor_status: {
          type: String,
        },
        material_no: {
          type: String,
        },
        material_description: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        net_price: {
          type: Number,
        },
        selling_price: {
          type: Number,
        },
        mrp_amount: {
          type: Number,
        },
        taxable_value: {
          type: Number,
        },
        discount_amount: {
          type: Number,
        },
        discount_perc: {
          type: Number,
        },
        pending_qty: {
          type: Number,
        },
        received_qty: {
          type: Number,
          default: 0,
        },
        grn_qty: {
          type: Number,
        },
        rejected_qty: {
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
//Populate User Name for Stage Verification
purchaseOrderGRN.plugin(autopopulate);

// Mongoose Auto Increement
purchaseOrderGRN.plugin(autoIncrement, {
  inc_field: "sequence",
});

purchaseOrderGRN.index({});

// exporting the entire module
module.exports = mongoose.model("purchaseorderGRN", purchaseOrderGRN);
