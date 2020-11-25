const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const salesOrder = new Schema({
  'cityId': {
    type: 'String',
    enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
  },
  'orderPK': {
    type: 'Number'
  },
  'onlineReferenceNo': {
    type: 'Number'
  },
  'onlineChildReferenceNo': {
    type: 'String'
  },
  'createdAt': {
    type: 'Date'
  },
  'updatedAt': {
    type: 'Date'
  },
  'status': {
    type: 'String'
  },
  'orderRemarks': {
    type: 'String'
  },
  'Channel': {
    type: 'String'
  },
  'totalQuantity': {
    type: 'Number'
  },
  'totalFreeQty': {
    type: 'Number'
  },
  'totalAmount': {
    type: 'Number'
  },
  'paymentMode': {
    type: 'String'
  },
  'totalTaxAmount': {
    type: 'Number'
  },
  'totalDiscountAmount': {
    type: 'Number'
  },
  'courierPartner': {
    type: 'String'
  },
  'shippingId': {
    type: 'String'
  },
  'shippingName': {
    type: 'String'
  },
  'shippingAddress1': {
    type: 'String'
  },
  'shippingAddress2': {
    type: 'String'
  },
  'shippingPlace': {
    type: 'String'
  },
  'shippingState': {
    type: 'String'
  },
  'shippingCountry': {
    type: 'String'
  },
  'shippingPincode': {
    type: 'String'
  },
  'shippingPhone': {
    type: 'String'
  },
  'shippingMobile': {
    type: 'String'
  },
  'shippingEmail': {
    type: 'String'
  },
  'shippingCharge': {
    type: 'Number'
  },
  'packingCharge': {
    type: 'Number'
  },
  'shippingMethod': {
    type: 'String'
  },
  'ShipmentPointsUsed': {
    type: 'Number'
  },
  'shipmentItems': {
    type: 'Number'
  },
  'shipmentABN': {
    type: 'String'
  },
  'shipmentWeight': {
    type: 'Number'
  },
  'latitude': {
    type: 'String'
  },
  'longitude': {
    type: 'String'
  },
  'customeLatitude': {
    type: 'String'
  },
  'customerLongitude': {
    type: 'String'
  },
  'discountCoupon': {
    type: 'String'
  },
  'deliveryDate': {
    type: 'Date'
  },
  'locationId': {
    type: 'Number'
  },
  'userId': {
    type: 'String'
  },
  'appUserName': {
    type: 'String'
  },
  'customerCode': {
    type: 'Number'
  },
  'customerId': {
    type: 'String'
  },
  'customerName': {
    type: 'String'
  },
  'customerType': {
    type: 'String'
  },
  'customerAddressLine1': {
    type: 'String'
  },
  'customerAddressLine2': {
    type: 'String'
  },
  'customerAddressLine3': {
    type: 'String'
  },
  'customerArea': {
    type: 'String'
  },
  'customerCity': {
    type: 'String'
  },
  'customerState': {
    type: 'String'
  },
  'customerCountry': {
    type: 'String'
  },
  'customerPincode': {
    type: 'String'
  },
  'customerPhone': {
    type: 'String'
  },
  'customerMobile': {
    type: 'String'
  },
  'customerEmail': {
    type: 'String'
  },
  'ordTimestamp': {
    type: 'Number'
  },
  'outletId': {
    type: 'Number'
  },
  'isOfflineOrder': {
    type: 'Number'
  },
  'invoiceNo': {
    type: 'String'
  },
  'deliveryBoy': {
    type: 'String'
  },
  'deilveryBoyMobileNo': {
    type: 'String'
  },
  'otherChargesTaxAmount': {
    type: 'Number'
  },
  'otherChargesTaxPercentage': {
    type: 'Number'
  },
  'otherChargesTaxInclusive': {
    type: 'String'
  },
  'location': {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
  },
  'orderItems': [
    {
      'rowNo': {
        type: 'Number'
      },
      'id': {
        type: 'Number'
      },
      'itemId': {
        type: 'Number'
      },
      'itemName': {
        type: 'String'
      },
      'itemReferenceCode': {
        type: 'String'
      },
      'salePrice': {
        type: 'Number'
      },
      'quantity': {
        type: 'Number'
      },
      'suppliedQty': {
        type: 'String'
      },
      'itemAmount': {
        type: 'Number'
      },
      'iBarU': {
        type: 'Number'
      },
      'taxPercentage': {
        type: 'Number'
      },
      'itemTaxType': {
        type: 'String'
      },
      'discountPercentage': {
        type: 'Number'
      },
      'itemRemarks': {
        type: 'String'
      },
      'itemMarketPrice': {
        type: 'Number'
      },
      'freeQty': {
        type: 'Number'
      },
      'orderPK': {
        type: 'Number'
      },
    }
  ],

}, {
  timestamps: true
});

salesOrder.index({
  'onlineReferenceNo': 1,
  'createdAt': 1
});

// exporting the entire module
module.exports = mongoose.model('salesOrder', salesOrder);