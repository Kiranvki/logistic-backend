const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autopopulate = require('mongoose-autopopulate');
const autoIncrement = require('mongoose-sequence')(mongoose);
// schema
const invoiceMaster = new Schema({

  soId: {
    type: Number
  },
  
  so_db_id: {
    type: Schema.Types.ObjectId,
    ref: 'salesOrder'
  },

  so_deliveryDate: {
    type: Date
  },

  isSelected: {
    type: Boolean,
    default: false
  },

  'cityId': {
    type: 'String',
    enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
  },

  customerName: {
    type: String
  },

  'companyDetails':
  {
    'name': {
      type: 'String',
    },
    'address': {
      type: 'String',
    },
    'telephoneNo': {
      type: 'String',
    },
    'pinCode': {
      type: 'Number',
    },
    'gstNo': {
      type: 'String',
    },
    'email': {
      type: 'String',
    },
    'cinNo': {
      type: 'String',
    },
    'websiteInfo': {
      type: 'String',
    },
    'contactNo': {
      type: 'Number',
    },
    'fssaiNo': {
      type: 'Number',
    },
    'cityId': {
      type: 'String',
      enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
    },
  },

  'payerDetails': //payers
  {
    'name': {
      type: 'String',
    },
    'address': {
      type: 'String',
    },
    'mobileNo': {
      type: 'String',
    },
    'gstNo': {
      type: 'String',
    },
    'email': {
      type: 'String',
    },
    'cityId': {
      type: 'String',
      enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
    },
  },

  'shippingDetails':  //sold_to_party  //bill_to_party
  {
    'name': {
      type: 'String',
    },
    'address': {
      type: 'String',
    },
    'mobileNo': {
      type: 'String',
    },
    'gstNo': {
      type: 'String',
    },
    'email': {
      type: 'String',
    },
    'cityId': {
      type: 'String',
      enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
    },
  },

  'invoiceDetails':
  {
    'invoiceNo': { //invoice no
      type: 'String',
    },
    'invoiceDate': {  //billing_date in sap
      type: 'Date',
    },
    'legacyInvoiceNo': {  //not in sap
      type: 'String',
    },
    'sapID': { //invoice no
      type: 'String',
    },
    'erpId': { //not reqwuirreed
      type: 'String',
    },
    'customerPoNo': { //not in sap
      type: 'String',
    },
    'customerPoDate': { //not in sap
      type: 'Date',
    },
    'deliveryNo': {  //delivery_doc_no
      type: 'String',
    },
    'paymentTerms': { //payment_terms
      type: 'String',
    },
    'deliveryFrom': { //shipping_point
      type: 'String',
    },
  },

  // SAP fields
  /*
  'itemDetails': [
    {
      'hsnCode': {
        type: 'String',
      },
      'materialDescription': {
        type: 'String',
      },
      'uom': {
        type: 'String',
      },
      'mrp': {
        type: 'Number',
      },
      'pricePerunit': {
        type: 'Number',
      },
      'quantity': {
        type: 'Number',
      },
      'basePrice': {
        type: 'Number',
      },
      'cgstPercentage': {
        type: 'Number',
      },
      'cgstAmount': {
        type: 'Number',
      },
      'sgstPercentage': {
        type: 'Number',
      },
      'sgstAmount': {
        type: 'Number',
      },
      'total': {
        type: 'Number',
      },
    }],
    */
  'invoiceDate': {
    type: 'Date',
  },

  'totalQuantitySupplied': {
    type: 'Number',
  },
  'totalQuantityDemanded': {
    type: 'Number',
  },
  'totalAmount': {
    type: 'Number',
  },
  'totalTax': {
    type: 'Number',
  },
  'totalDiscount': {
    type: 'Number',
  },
  'totalNetValue': {
    type: 'Number',
  },
  'isDelivered': {
    type: 'Number',
    default: 0
  },
  'itemSupplied': [
    {

      'itemId': {
        type: 'Number'
      },
      'itemName': {
        type: 'String'
      },

      'salePrice': {
        type: 'Number'
      },
      'quantity': {
        type: 'Number'
      },
      'suppliedQty': {
        type: 'Number'
      },
      'itemAmount': {
        type: 'Number'
      },

      'taxPercentage': {
        type: 'Number'
      },

      'discountPercentage': {
        type: 'Number'
      },
      'freeQty': {
        type: 'Number'
      },
      'discountForSingleItem': {
        type: 'Number'
      },

      'amountAfterDiscountForSingle': {
        type: 'Number'
      },
      'amountAfterTaxForSingle': {
        type: 'Number'
      },
      'taxValueForSingleItem': {
        type: 'Number'
      },
      'netValueForSingleItem': {
        type: 'Number'
      },
      'weightInKg': {
        type: Number
      },
      'totalSuppliedQuantity': {
        type: Number
      },
      'requiredQuantity': {
        type: Number
      },
    }
  ],
  
  'totalWeight': {
    type: Number
  },
  'seq': {
    type: Number
  }

}, {
  timestamps: true
});

//Populate User Name for Stage Verification
invoiceMaster.plugin(autopopulate);

// Mongoose Auto Increement 
invoiceMaster.plugin(autoIncrement, {
  inc_field: 'seq'
});

invoiceMaster.index({

});

// exporting the entire module
module.exports = mongoose.model('invoiceMaster', invoiceMaster);