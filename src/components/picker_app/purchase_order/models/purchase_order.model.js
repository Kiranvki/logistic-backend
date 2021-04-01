const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// schema
const purchaseOrder = new Schema({
  "po_number":{
    type: String
  },
  "po_document_type": {
    type: String
  },
  sapGrnNo:[{
    date:{
      type: String
    },
    sapGrnNo:{
      type: String
    },
    itemCount:{
      type:Number
    },
    grnId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'purchaseorderGRN',
    }
  }], 
  "company_code": {
    type: Number
  }, 
  "vendor_no": {
    type: String
  },  
  "purchase_organisation": {
    type: String
  },
  "purchase_group": {
    type: String
  },
  "plant": {
    type: String
  },
  "document_date": {
    type: String
  },
  "start_of_validity_period": {
    type: String
  },
 
  "status": {
    type: String
  }, 
  "poStatus": {
    type: Number
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

  "vendorInvoiceNo":{
    type: String
  }, 
   "delivery_date":{
    type: String
  },
  "delivery_date_array":[{
    type: String
  }],
  "end_of_validity_period":{
      type: String
  }, 
  "referance_no":{
    type: String
  },
  "item":[
    {
    "item_no": {
      type: String
    }, 
    "plant": {
      type: String
    }, 
    "material_group": {
      type: String
    }, 
    "material_group": {
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
    "item_name":{
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

  }
  ]
  }, 
  {
  timestamps: true
});



purchaseOrder.index({

});

// exporting the entire module
module.exports = mongoose.model('purchaseorder', purchaseOrder,'purchase_order');