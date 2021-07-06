const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// "delivery_type": "Y001",
// "delivery_no": "0080000000",
// "picking_date": "2020-07-16",
// "picking_time": 111749,
// "item": [
//     {
//         "material": 800001000102200001,
//         "delivery_quantity": "3.000 ",
//         "storage_location": 306,
//         "plant": 3001,
//         "uom": "EA"

// schema
const pickerBoySalesOrderItemsMapping = new Schema({
  'pickerBoySalesOrderMappingId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoyOrderMapping',
  },


  'itemDetail': [{
    'partialItemRemark': [{
      type: String
    }],
    'item_no': {
      type: String
    },
    'material_no': {   //material  //SAP Field
      required: true,
      type: String,
    },
    'itemName': {
      type: String,
    },
    'uom': {   //SAP Field
      type: String
    },


    'salePrice': { //old field

      type: Number,
    },
    'pickedQuantity': { //delivery_quantity //not SAP Field
      required: true,
      type: Number,
    },
    'suppliedQty': {   
      required: true,
      type: Number,
    },
    'requireQuantity': {
      required: true,
      type: Number,
    },
    'totalQuantity': {
      required: true,
      type: Number,
    },
    'storage_location': { //SAP Field
      type: String
    },
    'plant': {   //SAP Field
      type: String
    },


    'mrp_amount': { //sap
      required: true,
      type: String,
    },
    'discount_amount': { //sap
      required: true,
      type: String,
    },
    'taxPercentage': { //old field

      type: Number,
    },
    'cgst-pr': {   //SAP Field
      type: String
    },
    'sgst_pr': {   //SAP Field
      type: String
    },
    'igst_pr': {   //SAP Field
      type: String
    },
    'ugst_pr': {   //SAP Field
      type: String
    },
    'discountPercentage': {
      required: true,
      type: String,
    },
    'freeQty': {
      required: true,
      type: Number,
    },
    'isItemPicked': {
      required: true,
      type: Boolean,
      default: true
    },
    'total_amount': {
      required: true,
      type: String,
    }


  }],
  'isDeleted': {
    type: Number,
    default: 0
  },
  'status': {
    type: Number,
    default: 1
  },
  'createdBy': {
    type: String,
  },
  'invoiceDetail': {
    'isInvoice': {
      type: Boolean,
      default: false

    },
    'invoiceId': {
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

pickerBoySalesOrderItemsMapping.index({
  'pickerBoySalesOrderMappingId': 1,
  'itemId': 1
});

class PickerBoySalesOrderItemsMappingClass{
  static async addItem(orderObjItem){
    let isExist = await this.count({ 'pickerBoySalesOrderMappingId':orderObjItem.pickerBoySalesOrderMappingId,'isDeleted': 0 });
    if(isExist){

      return await this.update({ 'pickerBoySalesOrderMappingId':orderObjItem.pickerBoySalesOrderMappingId,'isDeleted': 0},{$push:{'itemDetail':orderObjItem.itemDetail}})
      
    }
    // let obj = await new this(orderObjItem).save()
    return await this(orderObjItem).save();


  }

  static async getItemAddedByPickerBoyId(pickerBoySalesOrderMappingId) {
    let isExist = await this.count({ 'pickerBoySalesOrderMappingId': mongoose.Types.ObjectId(pickerBoySalesOrderMappingId),'isDeleted': 0});
    if (isExist) {

      return await this.find({ 'pickerBoySalesOrderMappingId': pickerBoySalesOrderMappingId, 'isDeleted': 0 }).lean()

    }
    // let obj = await new this(orderObjItem).save()
    return false

  }
}
pickerBoySalesOrderItemsMapping.loadClass(PickerBoySalesOrderItemsMappingClass)
// exporting the entire module
module.exports = mongoose.model('pickerBoySalesOrderItemsMapping', pickerBoySalesOrderItemsMapping);