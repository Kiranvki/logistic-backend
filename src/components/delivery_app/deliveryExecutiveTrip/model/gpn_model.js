const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");
const Schema = mongoose.Schema;

const gatePassNumberSchema = new Schema(
  {
    deliverExecutiveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "deliveryExecutive",
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
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "trips",
    },
    spotSalesId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "spotSales",
      },
    ],

    invoiceNumber: [
      {
        type: String,
      },
    ],

    gpn: {
      type: String,
      default: 1,
      required: true,
      default: 0,
    },

    isVerify: {
      type: Number,

      required: true,
      default: 0,
    },
    orderType: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      required: true,
      default: 0,
    },
    isDeleted: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

gatePassNumberSchema.plugin(autopopulate);

class GpnClass {
  static async generateGpn(gpnData) {
    // let userExist = await this.count({ email });
    // if(userExist) throw new Error('Email is already exist.');
    // let phoneExist = await this.count({cell_phone})
    // if(phoneExist) throw new Error('Phone is already exist.');

    let gpnDetail = await new this(gpnData).save();

    return gpnDetail.toObject();
  }
}

gatePassNumberSchema.loadClass(GpnClass);

// exporting the entire module
module.exports = mongoose.model("gatePassNumber", gatePassNumberSchema);
