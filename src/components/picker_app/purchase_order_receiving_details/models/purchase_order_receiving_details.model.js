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
    default:4
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
  "item":[
    {
      "is_edited":{
        type: Number
      },
      "item_no": {
        type: String
      }, 
      "plant": {
        type: String
      }, 
      "material_group": {
        type: String
      }, 
      "material_description":{
        type: String
      },
      "storage_location": {
        type: String
      },  
      "tax_code": {
        type: String
      },  
      "conversion_factor_status": {
        type: String
      }, 
      "material_no":{
        type: String
      },
      "quantity": {
        type: Number
      }, 
      "net_price": {
        type: Number
      }, 
      "selling_price": {
        type: Number
      }, 
      "mrp_amount": {
        type: Number
      }, 
      "taxable_value": {
        type: Number
      }, 
      "discount_amount": {
        type: Number
      }, 
      "discount_perc": {
        type: Number
      }, 
      "pending_qty": {
        type: Number
      }, 
      "received_qty": {
        type: Number,
        default:0
      }, 
        "grn_qty": {
        type: Number
      }, 
      "rejected_qty": {
        type: Number
      }, 
      "remarks":{
        type: String
      }, 
      "date_of_manufacturing":{
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