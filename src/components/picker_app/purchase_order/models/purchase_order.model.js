const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// schema
const purchaseOrder = new Schema({
  "poNo":{
    type: Number
  },
  "poDate": {
    type: Date
  },
  "poAmount": {
    type: Number
  }, 
  "status": {
    type: String
  }, 
  "poStatus": {
    type: Number
  },
  "recievingStatus": {
    type: Number,
    default:0
  },
  // 1 initiated Recieving
  // 2 added itms to recieving cart
  //3 grn generated
  "supplierCode":{
    type: String
  }, 
  "netWeight":{
    type: Number,
    default:0
  }, 
  "vendorInvoiceNo":{
    type: String
  }, 
  "supplierName":{
    type: String
  },
  "supplierPhone":{
    type: Date
  },
   "deliveryDate":{
    type: Date
  },
  "expiryDate":{
      type: Date
  }, 
  "cashDiscount": {
    type: Number
  }, 
  "totalTaxAmount": {
    type: Number
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
      "recievedQty": {
      type: Number
    }, 
      "grnQty": {
      type: Number
    }, 
    "rejectedQty": {
      type: Number
    }, 
    "isDeleted": {
      type: Number
    }
  }
  ]
  }, 
  {
  timestamps: true
});



purchaseOrder.index({

});

// exporting the entire module
module.exports = mongoose.model('purchaseorder', purchaseOrder);