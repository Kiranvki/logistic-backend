const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const pickerBoySalesOrderItemsMapping = new Schema({
  'pickerBoySalesOrderMappingId': {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pickerBoySalesOrderMapping',
  },
  'itemDetail':[{
    'itemId': {
      required: true,
      type: Number,
    },
    'itemName': {
      type: String,
    },
  
    'salePrice': {
      required: true,
      type: Number,
    },
    'quantity': {
      required: true,
      type: Number,
    },
    'suppliedQty': {    //total_quantity-supplied_quantity
      required: true,
      type: Number,
    },
    'itemAmount': {
      required: true,
      type: Number,
    },
    'taxPercentage': {
      required: true,
      type: Number,
    },
    'discountPercentage': {
      required: true,
      type: Number,
    },
    'freeQty': {
      required: true,
      type: Number,
    },
  

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
  'invoiceDetail':{
    'isInvoice':{
      type:Boolean,
      default:false

    },
    'invoiceId':{
      'invoiceDbId':{
        type:mongoose.Types.ObjectId,

      },
      'invoiceId':{
        type:String,
        default:null
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
    let isExist = await this.count({ 'pickerBoySalesOrderMappingId':orderObjItem.pickerBoySalesOrderMappingId });
    if(isExist){
      return await this.update({ 'pickerBoySalesOrderMappingId':orderObjItem.pickerBoySalesOrderMappingId },{$push:{'itemDetail':orderObjItem.itemDetail}})
    }
    let obj = await new this(orderObjItem).save()
    return obj.toObject()


  }
}
pickerBoySalesOrderItemsMapping.loadClass(PickerBoySalesOrderItemsMappingClass)
// exporting the entire module
module.exports = mongoose.model('pickerBoySalesOrderItemsMapping', pickerBoySalesOrderItemsMapping);