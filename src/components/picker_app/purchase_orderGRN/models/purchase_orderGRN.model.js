const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autopopulate = require('mongoose-autopopulate');
const autoIncrement = require('mongoose-sequence')(mongoose);

// schema
const purchaseOrderGRN = new Schema({
  "poNo":{
    type: Number
  },
  poReceivingId:{
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'purchaseorderreceivingdetails',
  },
  sapGrnNo:{
    type: String
  }, 
  "grnNo": {
    type: String
  }, 
  "poDate": {
    type: String
  },
  "vendorInvoiceNo": {
    type: String
  },
  "status": {
    type: Number,
    default:1
  }, 
  "receivingStatus": {
    type: Number,
    default:0
  },
    // 4 initiated Receiving
  // 3 added itms to receiving cart
  //2 if fullfillment status is partially fulfilled and  grn is generated 
    //1 if fullfillment status is  fulfilled and  grn is generated
  "fulfilmentStatus": {
    type: Number,
    default:0
  },
  //2 partially fulfilled
  //1 fullfilled
  'sequence': {
      type: Number
  },
  supplierDetails:{
    "supplierCode":{
      type: String
    }, 
    "supplierName":{
      type: String
    },
    "supplierPhone":{
      type: Date
    },
  },
   "deliveryDate":{
    type: String
  }, 
  "remarks":{
    type: String
  },
  "timeStamp":{
    type: String
  }, 
  "locationId": {
  type: Number
  },
  "grnNo":{
    type: String
  }, 
  "poVendorNumber":{
    type: String
  }, 
  "poVendorDate":{
    type: String
  },
  "discount": {
    type: Number
  }, 
  "totalTaxAmount": {
    type: Number
  }, 
  "poAmount": {
    type: Number
  }, 
  netTotal:{
    type: Number
  },
  "generatedBy": {
    type: String
  },
  "isDeleted":{
    type: Number,
    default:0
  },
  "orderItems":[{
    "rowNo": {
      type: Number
    }, 
    "itemId":{
      type: String
    }, 
    "itemName":{
      type: String
    }, 
    "quantity": {
      type: Number
    }, 
    "freeQty": {
      type: Number
    }, 
    "uomType": {
      type: String
    }, 
    "convFactor": {
      type: Number
    }, 
    "cost": {
      type: Number
    }, 
    "sellingPrice": {
      type: Number
    }, 
    "itemAmount": {
      type: Number
    }, 
    "taxAmount": {
      type: Number
    }, 
    "mrp": {
      type: Number
    }, 
    "hsnCode":{
      type: String
    }, 
    "eanCode":{
      type: String
    }, 
    "itemDiscount": {
      type: Number
    }, 
    "itemDiscountPerc": {
      type: Number
    }, 
      "pendingQty": {
      type: Number
    }, 
    "receivedQty": {
      type: Number,
      default:0
    }, 
      "grnQty": {
      type: Number
    }, 
    "rejectedQty": {
      type: Number
    }
  }
  ]
  }, 
  {
  timestamps: true
});
//Populate User Name for Stage Verification
purchaseOrderGRN.plugin(autopopulate);

// Mongoose Auto Increement 
purchaseOrderGRN.plugin(autoIncrement, {
  inc_field: 'sequence'
});


purchaseOrderGRN.index({

});

// exporting the entire module
module.exports = mongoose.model('purchaseorderGRN', purchaseOrderGRN);