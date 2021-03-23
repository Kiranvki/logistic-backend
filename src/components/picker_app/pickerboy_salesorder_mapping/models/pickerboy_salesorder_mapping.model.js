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

  'isStartedPicking':{   //false- not started true - started picking 
    type:Boolean,
    require:true,
    default:true
  },
  'isItemPicked':{  //true-item added to the  false - no item added
    type:Boolean,
    require:true,
    default:false
  },
  'createdBy': {
    type: String,
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
    enum: [0,1, 2, 3]
    /**
     * state 0 : started picking order but no item picked
     * state 1 : packing
     * state 2 : invoice generated
     * state 3 : on boarded to vehicle
     */
  },
  'isDeleted': {
    type: Number,
    
    default: 0
  },
  'status': {
    type: Number,
    
    default: 1
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

pickerBoyOrderMappingSchema.index({
  'pickerBoyId': 1,
  'salesOrderId': 1
});

pickerBoyOrderMappingSchema.plugin(autopopulate);

class PickerBoyOrderMappingClass{

  static async startPickingOrder(orderAndPickerBoyObj) {
    console.log(orderAndPickerBoyObj)

    let pickerBoyOrderMappingData =  await new this(orderAndPickerBoyObj).save()
    console.log(pickerBoyOrderMappingData)
    

    return await this.find({'_id':pickerBoyOrderMappingData._id}).populate('salesOrderId');
    

}


static async getOrderPickerBoyMapping(searchObj){
  console.log(searchObj)
  let orderPickerBoyMappingData = this.find(...searchObj);
  return orderPickerBoyMappingData;

}



}

pickerBoyOrderMappingSchema.loadClass(PickerBoyOrderMappingClass);

// exporting the entire module
module.exports = mongoose.model('pickerBoyOrderMapping', pickerBoyOrderMappingSchema);