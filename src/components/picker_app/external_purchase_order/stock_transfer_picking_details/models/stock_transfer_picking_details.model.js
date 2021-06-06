const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// schema
const stockTransferPickingDetailSchema = new Schema(
  {
    pickerBoyId: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: 'pickerBoy',
      autopopulate: {
        select: ['fullName', 'employeeId'],
      },
    },
    invoiceRetryCount:{
      type:Number,
      default:-1
    },
    deliveryRetryCount:{
      type:Number,
      default:-1
    },
    delivery_no:{
      type:String,
      default:'N/A'

    },
    pickingAllocationDate:{
      type:Date
    },
// true when item is added into the bucket
    isItemPicked:{
      type:Boolean,
      default:false

    },
// true when STO PO is selected/added into the picking state
    isStartedPicking:{
      type:Boolean,
      default:false
    },
  
    
      // 4 initiated Picking
    // 3 added itms to  cart
    //2 if fullfillment status is partially fulfilled and  grn is generated
    //1 if fullfillment status is  fulfilled and  grn is generated
    pickingStatus: {
      type: Number,
      default: 4,
    },
    
  

      //1 partially fulfilled
    //2 fullfilled
    fullfilment: {
      type: Number,
      default: 0,
    },
 

  
    status: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Number,
      default: 0,
    },
    remarks: [{
      type: String,
      default: 'N/A'
    }],
    stoNumber:{
      type:String
    },
    plant:{
      type:String
    },
    shipping_plant:{
      type:String
    },
    vendor_name:{
      type:String
    },
    stoDbId: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: 'purchase_order',
    },
    pickingDate: {
      type: Date,
    },
    item: [

      {is_item_picked:{
        type:Boolean,
        default:true
      },
      fullfilment:{
        type:Number
      },
        is_edited: {
          type: Number,
        },
        item_no: {
          type: String,
        },
        plant: {
          type: String,
        },
        material_group: {
          type: String,
        },
        material_description: {
          type: String,
        },
        storage_location: {
          type: String,
        },
        tax_code: {
          type: String,
        },
        conversion_factor_status: {
          type: String,
        },
        material_no: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        net_price: {
          type: Number,
        },
        selling_price: {
          type: Number,
        },
        mrp_amount: {
          type: Number,
        },
        taxable_value: {
          type: Number,
        },
        discount_amount: {
          type: Number,
        },
        discount_perc: {
          type: Number,
        },
        pending_qty: {
          type: Number,
        },
        pickedQuantity: {
          type: Number,
          default: 0,
        },
     
        rejected_qty: {
          type: Number,
        },
        remarks: [{
          type: String,
        }],
        date_of_manufacturing: {
          type: String,
        },
      },
    ],
    isSapError:{
        type:String
    },
    pickingAllocationRequestPayload:[{
        type:String
    }],
    pickingAllocationResponsePayload:[{
        type:String
    }],
    invoiceRequestPayload:[{
        type:String
    }],
    invoiceResponsePayload:[{
        type:String
    }],
    invoiceDetail: {
      isInvoiceRequest: {
        type: Boolean,
        default: false  //true->restrict picker boy
  
      },
      isInvoice: {
        type: Boolean,
        default: false
  
      },
      invoice: {
        invoiceDbId: {
          type: mongoose.Types.ObjectId,
  
        },
        invoice_no: {
          type: String,
          default: null
        },
        invoiceDate:{
          type:Date
        }
      }
    }
  },
  {
    timestamps: true,
  }
);

stockTransferPickingDetailSchema.index({});


class stockTransferPickingDetailClass {

  static async startPickingOrder(orderAndPickerBoyObj) {
    console.log(orderAndPickerBoyObj)
    // let isExist = await this.count({ '_id': pickerBoyOrderMappingId });
    let pickerBoyOrderMappingData = await new this(orderAndPickerBoyObj).save()
    console.log(pickerBoyOrderMappingData)


    return await this.aggregate([{
      $match:
      {
        '_id': pickerBoyOrderMappingData._id
      }
    },{
      $lookup:{
        'from':'purchase_order',
        'let':{'id':'$stoDbId'},
        'pipeline':[{
          $match:{
            '$expr' : {'$eq' : ['$_id','$$id']}
          }
        },
      {$project:{
        "id": 1,
        
        "po_document_type":1,
        "company_code": 1,
      
        "purchase_organisation": 1,
        "purchase_group": 1,
        "document_date": 1,
        "delivery_date": 1,
        
        
       
    
        "created_at": 1,
       
   
        "vendor_name":1,
        "item":1
      
      }}],
        'as':'stoDetails'

      }
    },
    {
      $project:{
        "pickingStatus": 1,
            "fullfilment": 1,
           
            "pickerBoyId": 1,
            "stoNumber": 1,
            "stoDbId": 1,
            "pickingDate": 1,
            "plant": 1,
            "shipping_plant": 1,
            "item": '$stoDetails.item',
            "id": {$arrayElemAt:['$stoDetails.id',0]},
           
            "po_document_type": {$arrayElemAt:["$stoDetails.po_document_type",0]},
            "company_code": {$arrayElemAt:["$stoDetails.company_code",0]},
            "vendor_no": {$arrayElemAt:["$stoDetails.vendor_no",0]},
            "purchase_organisation": {$arrayElemAt:['$stoDetails.purchase_organisation',0]},
            "purchase_group": {$arrayElemAt:['$stoDetails.purchase_group',0]},
            "document_date": {$arrayElemAt:['$stoDetails.document_date',0]},
            "delivery_date": {$arrayElemAt:['$stoDetails.delivery_date',0]},
            
           
            
            "vendor_name": {$arrayElemAt:['$stoDetails.vendor_name',0]},
            
            "orderDate": {$arrayElemAt:['$stoDetails.created_at',0]}
      }
    }
  ]
  );


  }


  static async getOrderById(searchObj) {
    console.log(...searchObj)
    let orderPickerBoyMappingData = this.find(...searchObj);
    return orderPickerBoyMappingData;

  }

  static async updateIsItemPickedStatus(pickerBoySalesOrderMappingId, status) {

    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': pickerBoySalesOrderMappingId }, { $set: { 'isItemPicked': status, pickingStatus: 1 } });
    return orderPickerBoyMappingData;

  }

  static async updateDeliveryStatus(pickerBoyOrderMappingId, delivery_no, remarks) {

    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': pickerBoyOrderMappingId }, { $set: { 'delivery_no': delivery_no, 'remarks': remarks, pickingStatus: 2 } });
    return orderPickerBoyMappingData;

  }


  static async updateFullfilmentStatus(pickerBoyOrderMappingId, fullfilment) {
    console.log('update partial!')
    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': mongoose.Types.ObjectId(pickerBoyOrderMappingId) }, { $set: { 'fullfilment': fullfilment, 'isItemPicked': false, 'isStartedPicking': false } });
    return orderPickerBoyMappingData;

  }

  static async getOrderByPickerBoyId(pickerBoyOrderMappingId) {
    let isExist = await this.count({ '_id': pickerBoyOrderMappingId });
    if (isExist) {
      let orderPickerBoyMappingData = await this.find({ '_id': pickerBoyOrderMappingId }).lean().populate('salesOrderId');

      return orderPickerBoyMappingData;
    }
    return false;
  }



  static async getOrderHistoryByPickerBoyId(pickerBoyId) {
    let isExist = await this.count({ 'pickerBoyId': pickerBoyId });
    if (isExist) {
      // let todaysDate = moment(new Date()).format('YYYY-MM-DD');
      let orderPickerBoyMappingData = await this.find({ 'pickerBoyId': pickerBoyId }, { 'invoiceDetail.isInvoice': true }).lean().populate('stoDbId').lean();

      return orderPickerBoyMappingData;
    }
    return false;
  }




  static async updateOrderState(pickerBoySalesOrderMappingId, status) {

    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': mongoose.Types.ObjectId(pickerBoySalesOrderMappingId) }, { $set: { 'pickingStatus': status } });
    return orderPickerBoyMappingData;

  }


  static async updateInvoiceDetail(pickerBoyOrderMappingId, invObject) {
    // 'pickerBoyOrderMappingId':pickerBoyOrderMappingId,
    //         'isInvoice':true,
    //         'invoiceId':data['_id'],
    //           'invoice_no':invoiceDetail['invoice_no']
    //         }


    let orderPickerBoyMappingData = await this.findOneAndUpdate({ '_id': pickerBoyOrderMappingId }, { $set: { 'invoiceDetail.isInvoice': invObject.isInvoice, 'invoiceDetail.invoice.invoiceId': invObject.invoice_no, 'invoiceDetail.invoice.invoiceDbId': invObject.invoiceId, 'isItemPicked': false, 'isStartedPicking': false, 'customerName': invObject.customerName, 'pickingStatus': 3 } });
    return orderPickerBoyMappingData;

  }

  static async addItem(id,itemDetail){
    let isExist = await this.count({ '_id':mongoose.Types.ObjectId(id),'isDeleted': 0 });
    if(isExist){

      return await this.update({  '_id':mongoose.Types.ObjectId(id),'isDeleted': 0 },{$set:{isItemPicked:true},$push:{'item':itemDetail}})
      
    }
    // let obj = await new this(orderObjItem).save()
    return await this(orderObjItem).save();


  }


  static async getOrderDetailPickedByPickerBoyId(pickerBoyId){
   return await this.aggregate([{
      $match:
      {
        'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId),
        isItemPicked:true,
    // true when STO PO is selected/added into the picking state
        isStartedPicking:true
      }
    },{
      $lookup:{
        'from':'purchase_order',
        'let':{'id':'$stoDbId'},
        'pipeline':[{
          $match:{
            '$expr' : {'$eq' : ['$_id','$$id']}
          }
        },
      {$project:{
        "id": 1,
        
        "po_document_type":1,
        "company_code": 1,
      
        "purchase_organisation": 1,
        "purchase_group": 1,
        "document_date": 1,
        "delivery_date": 1,
        
        
      
        "created_at": 1,
       
   
        "vendor_name":1,
        "item":1
      
      }}],
        'as':'stoDetails'

      }
    },
    {
      $project:{
        "pickingStatus": 1,
            "fullfilment": 1,
           
            "pickerBoyId": 1,
            "stoNumber": 1,
            "stoDbId": 1,
            "pickingDate": 1,
            "plant": 1,
            "shipping_plant": 1,
            "item": 1,
            'orderItem':{$arrayElemAt:['$stoDetails.item',0]},
            "id": {$arrayElemAt:['$stoDetails.id',0]},
           
            "po_document_type": {$arrayElemAt:["$stoDetails.po_document_type",0]},
            "company_code": {$arrayElemAt:["$stoDetails.company_code",0]},
            "vendor_no": {$arrayElemAt:["$stoDetails.vendor_no",0]},
            "purchase_organisation": {$arrayElemAt:['$stoDetails.purchase_organisation',0]},
            "purchase_group": {$arrayElemAt:['$stoDetails.purchase_group',0]},
            "document_date": {$arrayElemAt:['$stoDetails.document_date',0]},
            "delivery_date": {$arrayElemAt:['$stoDetails.delivery_date',0]},
            
           
            
            "vendor_name": {$arrayElemAt:['$stoDetails.vendor_name',0]},
            
            "orderDate": {$arrayElemAt:['$stoDetails.created_at',0]}
      }
    }
  ]
  );

  }


  static async getPickedItemStatus(stoPickingId){
    return await this.aggregate([{
       $match:
       {
         '_id': mongoose.Types.ObjectId(stoPickingId)
       }
     },{
       $lookup:{
         'from':'purchase_order',
         'let':{'id':'$stoDbId'},
         'pipeline':[{
           $match:{
             '$expr' : {'$eq' : ['$_id','$$id']}
           }
         },
       {$project:{
         "id": 1,
         
         "po_document_type":1,
         "company_code": 1,
       
         "purchase_organisation": 1,
         "purchase_group": 1,
         "document_date": 1,
         "delivery_date": 1,
         
         
       
         "created_at": 1,
        
    
         "vendor_name":1,
         "item":1
       
       }}],
         'as':'stoDetails'
 
       }
     },
     {
       $project:{
         "pickingStatus": 1,
             "fullfilment": 1,
            
             "pickerBoyId": 1,
             "stoNumber": 1,
             "stoDbId": 1,
             "pickingDate": 1,
             "plant": 1,
             "shipping_plant": 1,
             "item": 1,
             'orderItem':{$arrayElemAt:['$stoDetails.item',0]},
             "id": {$arrayElemAt:['$stoDetails.id',0]},
            
             "po_document_type": {$arrayElemAt:["$stoDetails.po_document_type",0]},
             "company_code": {$arrayElemAt:["$stoDetails.company_code",0]},
             "vendor_no": {$arrayElemAt:["$stoDetails.vendor_no",0]},
             "purchase_organisation": {$arrayElemAt:['$stoDetails.purchase_organisation',0]},
             "purchase_group": {$arrayElemAt:['$stoDetails.purchase_group',0]},
             "document_date": {$arrayElemAt:['$stoDetails.document_date',0]},
             "delivery_date": {$arrayElemAt:['$stoDetails.delivery_date',0]},
             
            
             
             "vendor_name": {$arrayElemAt:['$stoDetails.vendor_name',0]},
             
             "orderDate": {$arrayElemAt:['$stoDetails.created_at',0]}
       }
     }
   ]
   );
 
   }


  static async updateStatus(updateQuery) {
  console.log(...updateQuery)
    let stoPickingDetails = await this.findOneAndUpdate(...updateQuery);
    return stoPickingDetails;

  }




}

stockTransferPickingDetailSchema.loadClass(stockTransferPickingDetailClass);



// exporting the entire module
module.exports = mongoose.model(
  'stockTransferPickingDetail',
  stockTransferPickingDetailSchema
);
