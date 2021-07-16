const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;
// keep updating updated at on every itempicked
//check the status of picker boy updatedAt>t time picker bot idle
// schema
const pickerBoyOrderMappingSchema = new Schema({
  'pickerBoyId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoy',
    autopopulate: {
      select: ['fullName', 'employeeId']
    }
  },
  'pickingDate': {
    type: Date,
  },

  'isStartedPicking': {   //false- not started true - started picking 
    type: Boolean,
    require: true,
    default: true
  },
  'isItemPicked': {  //true-item added to the  false - no item added
    type: Boolean,
    require: true,
    default: false
  },
  'invoiceRetryCount': {
    type: Number,
    default: -1
  },
  'deliveryRetryCount': {
    type: Number,
    default: -1
  },
  'createdBy': {
    type: String,
  },
  'delivery_type': {  //SAP fields
    type: String
  },
  'shipping_point': {  //SAP fields
    type: String
  },
  'delivery_no': {  //SAP fields
    type: String
  },
  'plant': {
    type: String
  },
  'delivery_date': {
    type: String
  },
  'picking_date': {  //SAP fields
    type: String
  },
  'picking_time': {  //SAP fields
    type: String
  },

  'sales_order_no': {  //SAP fields
    type: String
  },
  'salesOrderId': {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'salesOrder',
  },
  'purchaseOrderId': {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'salesOrder',
  },
  'stockTransferId': {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'salesOrder',
  },
  'assetTransferId': {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'salesOrder',
  },
  'truckSpotSalesId': {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'salesOrder',
  },
  'state': {
    type: Number,
    default: 0,
    enum: [0, 1, 2, 3,4]
    /**
     * state 0 : started picking order but no item picked
     * state 1 : packing
     * state 2 : Delivery generated
     * state 3 : invoice generated
     * state 4 : on boarded to vehicle
     */
  },
  'fullfilment': {
    type: Number
  },
  'isDeleted': {
    type: Number,

    default: 0
  },
  'picking_allocation_response': [{
    type: String
  }],
  'picking_allocation_request': [{
    type: String
  }],
  'invoice_response': [{
    type: String
  }],
  'invoice_request': [{
    type: String
  }],
  'remarks': [{
    type: String,
    default: 'N/A'
  }],
  'status': {
    type: Number,

    default: 1
  }, 'isSapError': {
    type: String
  },
  'invoiceDetail': {
    'isInvoiceRequest': {
      type: Boolean,
      default: false  //true->restrict picker boy

    },
    'isInvoice': {
      type: Boolean,
      default: false

    },
    'invoice': {
      'invoiceDbId': {
        type: mongoose.Types.ObjectId,

      },
      'invoiceId': {
        type: String,
        default: null
      }
    }
  }

}, {
  timestamps: true
});

pickerBoyOrderMappingSchema.index({
  'pickerBoyId': 1,
  'salesOrderId': 1
});

pickerBoyOrderMappingSchema.plugin(autopopulate);

class PickerBoyOrderMappingClass {

  static async startPickingOrder(orderAndPickerBoyObj) {
    console.log(orderAndPickerBoyObj)

    let pickerBoyOrderMappingData = await new this(orderAndPickerBoyObj).save()
    console.log(pickerBoyOrderMappingData)


    return await this.find({ '_id': pickerBoyOrderMappingData._id }).populate('salesOrderId');


  }


  static async getOrderPickerBoyMapping(searchObj) {
    console.log(searchObj)
    let orderPickerBoyMappingData = this.find(...searchObj);
    return orderPickerBoyMappingData;

  }

  static async updateIsItemPickedStatus(pickerBoySalesOrderMappingId, status) {



    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': pickerBoySalesOrderMappingId }, { $set: { 'isItemPicked': status, state: 1 } });
    return orderPickerBoyMappingData;

  }

  static async updateDeliveryStatus(pickerBoyOrderMappingId, delivery_no, remarks) {

    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': pickerBoyOrderMappingId }, { $set: { 'delivery_no': delivery_no, 'remarks': remarks, 'state': 2,'isItemPicked': false, 'isStartedPicking': false  } });
    return orderPickerBoyMappingData;

  }


  static async updateFullfilmentStatus(pickerBoyOrderMappingId, fullfilment) {
    console.log('update partial!')
    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': mongoose.Types.ObjectId(pickerBoyOrderMappingId) }, { $set: { 'fullfilment': fullfilment, 'isItemPicked': false, 'isStartedPicking': false } });
    return orderPickerBoyMappingData;

  }

  static async getOrderByPickerBoyId(pickerBoyOrderMappingId) {
    let isExist = await this.count({ '_id': pickerBoyOrderMappingId,'isDeleted': 0});
    if (isExist) {
      let orderPickerBoyMappingData = await this.find({ '_id': pickerBoyOrderMappingId,'isDeleted': 0 }).lean().populate('salesOrderId');

      return orderPickerBoyMappingData;
    }
    return false;
  }



  static async getOrderHistoryByPickerBoyId(pickerBoyId) {
    let isExist = await this.count({ 'pickerBoyId': pickerBoyId });
    if (isExist) {
      // let todaysDate = moment(new Date()).format('YYYY-MM-DD');
      let orderPickerBoyMappingData = await this.find({ 'pickerBoyId': pickerBoyId }, { 'invoiceDetail.isInvoice': true }).lean().populate('salesOrderId').lean();

      return orderPickerBoyMappingData;
    }
    return false;
  }




  static async updateOrderState(pickerBoySalesOrderMappingId, status) {

    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': mongoose.Types.ObjectId(pickerBoySalesOrderMappingId) }, { $set: { 'state': status } });
    return orderPickerBoyMappingData;

  }


  static async updateInvoiceDetail(pickerBoyOrderMappingId, invObject) {
    // 'pickerBoyOrderMappingId':pickerBoyOrderMappingId,
    //         'isInvoice':true,
    //         'invoiceId':data['_id'],
    //           'invoice_no':invoiceDetail['invoice_no']
    //         }


    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': pickerBoyOrderMappingId }, { $set: { 'invoiceDetail.isInvoice': invObject.isInvoice, 'invoiceDetail.invoice.invoiceId': invObject.invoice_no, 'invoiceDetail.invoice.invoiceDbId': invObject.invoiceId, 'isItemPicked': false, 'isStartedPicking': false, 'customerName': invObject.customerName, 'state': 3 } });
    return orderPickerBoyMappingData;

  }




}

pickerBoyOrderMappingSchema.loadClass(PickerBoyOrderMappingClass);

// exporting the entire module
module.exports = mongoose.model('pickerBoyOrderMapping', pickerBoyOrderMappingSchema);