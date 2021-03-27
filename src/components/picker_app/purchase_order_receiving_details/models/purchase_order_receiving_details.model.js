const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// schema
const purchaseOrderReceivingDetails = new Schema({
  'pickerBoyId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoy',
    autopopulate: {
      select: ['fullName', 'employeeId']
    }
  },
  "receivingStatus": {
    type: Number,
    default:1
  }, 
  // 1 initiated Receiving
  // 2 added itms to receiving cart
  //3 grn generated
  "fulfilmentStatus": {
    type: Number,
    default:0
  },
  //1 partially fulfilled
  //2 fullfilled
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
  "receivingDate" : {
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
      "receivedQty": {
      type: Number
    }, 
      "grnQty": {
      type: Number
    }, 
    "rejectedQty": {
      type: Number
    }, 
    "remarks":{
      type: String
    }, 
    "dateOfManufacturing":{
      type: String
    },
  }
  ]
  }, 
  {
  timestamps: true
});



purchaseOrderReceivingDetails.index({

});

// exporting the entire module
module.exports = mongoose.model('purchaseorderreceivingdetails', purchaseOrderReceivingDetails);