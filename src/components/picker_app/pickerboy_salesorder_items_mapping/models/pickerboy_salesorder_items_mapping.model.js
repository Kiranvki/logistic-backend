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


  'itemDetail':[{
    'itemNo':{
      type:String
    },
    'itemId': {   //material  //SAP Field
      required: true,
      type: Number,
    },
    'itemName': {
      type: String,
    },
    'uom':{   //SAP Field
      type:String
    },

  
    'salePrice': {
      required: true,
      type: Number,
    },
    'pickedQuantity': { //delivery_quantity //SAP Field
      required: true,
      type: Number,
    },
    'suppliedQty': {    //total_quantity-supplied_quantity 
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
    'storage_location':{ //SAP Field
      type:String
    },
    'plant':{   //SAP Field
      type:String
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
    'isItemPicked': {
      required: true,
      type: Boolean,
      default:true
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
    // let obj = await new this(orderObjItem).save()
     return await this(orderObjItem).save();


  }

  static async getItemAddedByPickerBoyId(pickerBoySalesOrderMappingId){
    let isExist = await this.count({ 'pickerBoySalesOrderMappingId':mongoose.Types.ObjectId(pickerBoySalesOrderMappingId) });
    if(isExist){

      return await this.find({ 'pickerBoySalesOrderMappingId':pickerBoySalesOrderMappingId })
      
    }
    // let obj = await new this(orderObjItem).save()
    return false

  }
}
pickerBoySalesOrderItemsMapping.loadClass(PickerBoySalesOrderItemsMappingClass)
// exporting the entire module
module.exports = mongoose.model('pickerBoySalesOrderItemsMapping', pickerBoySalesOrderItemsMapping);