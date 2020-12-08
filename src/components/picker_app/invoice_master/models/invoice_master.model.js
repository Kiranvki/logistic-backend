const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const invoiceMaster = new Schema({

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

  'payerDetails':
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

  'shippingDetails':
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
    'invoiceNo': {
      type: 'String',
    },
    'invoiceDate': {
      type: 'Date',
    },
    'legacyInvoiceNo': {
      type: 'String',
    },
    'sapID': {
      type: 'String',
    },
    'erpId': {
      type: 'String',
    },
    'customerPoNo': {
      type: 'String',
    },
    'customerPoDate': {
      type: 'Date',
    },
    'deliveryNo': {
      type: 'String',
    },
    'paymentTerms': {
      type: 'String',
    },
    'deliveryFrom': {
      type: 'String',
    },
  },

  // SAP fields
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
      'taxValueForSingleItem': {
        type: 'Number'
      },
      'netValueForSingleItem': {
        type: 'Number'
      },
    }
  ],

}, {
  timestamps: true
});

invoiceMaster.index({

});

// exporting the entire module
module.exports = mongoose.model('invoiceMaster', invoiceMaster);