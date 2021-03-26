const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// schema
const purchaseOrderRecievingDetails = new Schema({
  'pickerBoyId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoy',
    autopopulate: {
      select: ['fullName', 'employeeId']
    }
  },
  "recievingStatus": {
    type: Number,
    default:1
  }, 
  // 1 initiated Recieving
  // 2 added itms to recieving cart
  //3 grn generated
  "status": {
    type: Number,
    default:1
  }, 
  "isDeleted": {
    type: Number,
    default:0
  }, 
  "poId": {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'purchaseorder',

  },
  "recievingDate" : {
    type: Date
  },
  "netWeight": {
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
      "recievedQty": {
      type: Number
    }, 
      "grnQty": {
      type: Number
    }, 
    "rejectedQty": {
      type: Number
    }, 
  }
  ]
  }, 
  {
  timestamps: true
});



purchaseOrderRecievingDetails.index({

});

// exporting the entire module
module.exports = mongoose.model('purchaseorderrecievingdetails', purchaseOrderRecievingDetails);