const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const { error, info } = require('../../../utils').logging;

const moment = require('moment')
// const SalesOrderModel = require('../../sales_order/sales_order/models/sales_order.model')
const invoiceMasterModel = require('../../picker_app/invoice_master/models/invoice_master.model')
// const tripStageModel = require('./model/tripstages.model')
// const vehicleCheckedInModel = require('../../vehicle/vehicle_attendance/models/vehicle_attendance.model');
// const vehicleMasterModel = require('../../vehicle/vehicle_master/models/vehicle_master.model');
// const deliveryExecModel = require('../../employee/delivery_executive/models/delivery_executive.model');
const tripModel = require('../../MyTrip/assign_trip/model/trip.model')
const salesOrderModel= require('../../sales_order/sales_order/models/sales_order.model')
const spotSalesModel= require('../../MyTrip/assign_trip/model/spotsales.model');
var async = require('async');
import { v4 as uuidv4 } from 'uuid';
const gpnModel = require('./model/gpn_model')



// const transporterModel = require('../../transporter/transporter/models/transporter.model');
// const transVehicleModel = require('../../rate_category/ratecategory_transporter_vehicle_mapping/models/ratecategory_transporter_vehicle_mapping.model')
// const spotModel = require('./model/spotsales.model');
const _ = require('lodash');
const request = require('request-promise');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose');
var QRCode = require('qrcode');//QR code

class DeliveryExecutivetrip extends BaseController {

    // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.deliveryExecutive;
  };

  getTripByDeliveryExecutiveId = async(req,res,next) =>{
    console.log(req.query.page)
    let pageSize=100;
    let user = req.user, // user 
    deliveryExecutiveId = user._id
    let pageNumber = req.query.page;

    let dateToday= moment(Date.now()).set({
      h: 24,
      m: 59,
      s: 0,
      millisecond: 0
    }).toDate();
    
    let pipeline = [{

    
      $match:{$and:[{
        
          'transporterDetails.deliveryExecutiveId':deliveryExecutiveId
      },
      {'createdAt':{$gte:dateToday}
    }]
          

       
      }
      
    }
  //   {
  //     $unwind: "$salesOrderId"
  // }
   
    ,{
      $project:{
       _id:0,
        deliveryDetails:0,
        vehicleId:0,
        checkedInId:0,
        rateCategoryId:0,
     
        deliveryExecutiveId:0,
        invoice_db_id:0,
        invoiceNo:0,
        approvedBySecurityGuard: 0,
        isTripStarted: 0,
        isActive: 0,
        tripFinished: 0,
        isCompleteDeleiveryDone: 0,
        isPartialDeliveryDone: 0,
        returnedStockDetails: 0,
      
        __v:0




      }
    },
    {
      $skip:(pageSize*(pageNumber-1))
    },{
      $limit:100
    },
    // {
    //   $group: {
    //     _id: '$_id',
    //     totalSales:{$sum:1},
    //     orders:{
    //       $push: '$$ROOT'
    //     }
    //     // 'attendanceLog': { $push: '$attendanceLog' },
    //     // 'userId': { $push: '$userId' }
    //   }
    // },
    
     {
      $group: {
        _id: '$transporterDetails.deliveryExecutiveId',
        total:{$sum:1},
        tripData: {
          $push: '$$ROOT'
        }
        // 'attendanceLog': { $push: '$attendanceLog' },
        // 'userId': { $push: '$userId' }
      }
    },
    {$sort:{
      _id:-1
    }
  },
  
  
  
  ]
    let trip =await tripModel.aggregate(pipeline);
  
  

    try {
      info('getting delivery executive trip data!');

      // success response 
      this.success(req, res, this.status.HTTP_OK, 
        trip || []
      , this.messageTypes.deliveryExecutiveTriplistFetchedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

    // success(req, res, status, data = null, message = 'success')

  }
// Trip detail by tripID
  getTripByTripId = async(req,res,next) =>{
   
    let user = req.user, // user 
    deliveryExecutiveId = user._id
    let ID = parseInt(req.params.tripid);
    let pageSize=100;
    let pageNumber = req.query.page;
    info('getting trip data!');
    let pipeline = [
      {$match:{
        tripId:ID
      }},
      {
      $lookup:{
        from:'salesorders',
        localField:'salesOrderId',
        foreignField:'_id',
        as:'salesOrder'
      }
    }, 
    // {
    //   $group: {
    //     _id: '$salesOrderId',
    //     totalSalesOrder:{$sum:1},
    //     salesData: {
    //       $push: '$$ROOT'
    //     }
       
    //   }
    // },
    {
      $lookup:{
        from:'spotSales',
        localField:'spotSalesId',
        foreignField:'_id',
        as:'spotSales'
      }
    }, 
    {
      $project:{
_id:0
      }
    },
    // {
    //   $group: {
    //     _id: '$spotSalesId',
    //     totalSalesOrder:{$sum:1},
    //     spotSales: {
    //       $push: '$$ROOT'
    //     }
      
    //   }
    // },
   
    {
      $skip:(pageSize*(pageNumber-1))
    },{
      $limit:100
    }

    ]
    let trip =await tripModel.aggregate(pipeline);
    // find().populate('spotSalesId vehicleId salesOrderId');
  
  

    try {
      info('getting delivery executive trip data!');
 
      // success response 
      this.success(req, res, this.status.HTTP_OK, 
        trip || []
      , this.messageTypes.deliveryExecutiveTripDetailsFetchedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

    // success(req, res, status, data = null, message = 'success')

  }

  getOrderDetails = async (req,res,next)=>{
    let model;
    let pageSize=100;
    let pageNumber = req.query.page;
    switch(req.params.type){
      case 'salesorder':
        model= salesOrderModel;
        break;
      case 'spotsales':
        model= spotSalesModel;
        
        break;
      case 'assettransfer':
        model= require('../../MyTrip/assign_trip/model/spotsales.model')
        break;
      default:
        model=null
        break;

    }

    let pipeline =[
      {
        $match:{
          '_id':mongoose.Types.ObjectId(req.params.orderid)
        }
      },{
        $skip:(pageSize*(pageNumber-1))
      },{
        $limit:100
      }
    ]

    let orderData = await model.aggregate(pipeline)

    
    try {
      info('getting order data!');

      // success response 
      this.success(req, res, this.status.HTTP_OK, 
        orderData || []
      , this.messageTypes.deliveryExecutiveOrderDetailsFetchedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  
  }

  updateOrderStatus= async (req,res,next)=>{
    let Model;
    let pageSize=100;
    let pageNumber = req.query.page;
    let dataObj = req.body
    let user = req.user, // user 
    deliveryId = user._id

    switch(req.params.type){
      case 'salesorder':
        Model= salesOrderModel;
        break;
      case 'spotsales':
        Model= spotSalesModel;
        
        break;
      case 'assettransfer':
        mMdel= require('../../MyTrip/assign_trip/model/spotsales.model')
        break;
      default:
        Model=null
        break;

    }
    console.log(Model)
    // let suppliedQty = req.body.data[0].supplied_qty;
    // let itemRemarks = req.body.data[0].item_remarks;
    // let caret_count = req.body.data[0].caret_count;
    // let isVerified = req.body.data[0].isverified;
    // let string_ = suppliedQty+' '+itemRemarks+' '+caret_count+' '+isVerified;
    if (!_.isEmpty(dataObj)) {

      // creating the push object 
      let updateObject = {
        // 'orderItems.$.suppliedQty': dataObj.supplied_qty,
        'orderItems.$.itemRemarks': dataObj.itemRemarks[0],
        'caretCount':dataObj.caretCount
        
      };

      // updating the last login details 
      let updatedOrderDetail = await Model.findOneAndUpdate({
        'orderItems._id': mongoose.Types.ObjectId(req.params.orderid)
        
      },
        {
          $set: updateObject
        }, {
        
        'new': true
      });
      console.log(updatedOrderDetail)
    try {
      info('updating order!');
      
  
      // success response 
      this.success(req, res, this.status.HTTP_OK, 
        updatedOrderDetail || []
      , this.messageTypes.deliveryExecutiveOrderUpdatedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }


  }
}

  generateGpnNumber = async (req,res,next)=>{
    let user = req.user, // user 
    deliveryExecutiveId = user._id
    let ID = parseInt(req.params.tripid);
    let salesOrderId = req.params.soid
    let orderType = req.params.type
    let cratetIn = req.query.cratecount || req.query.crateCount  || 0;
    let pageSize=100;
    
    
    let isVerify = req.query.verify?req.query.verify:0;


    // sales order update caret
    
  
    let updatedOrderDetail = await salesOrderModel.update(
      {
        '_id': mongoose.Types.ObjectId('6023d4cce4cd267f8e79466e') 
      },
      {
         $inc: 
         {
            'crateIn': crateIn
          }
         }
   )
    

  //  sales order update end
    
    
    
    
  

   
    
    info('getting trip data!');
    let pipeline = [
      {$match:{
        so_db_id:mongoose.Types.ObjectId('5ff4161a56742a7178ed445d')
      }},
      {
      $lookup:{
        from:'salesorders',
        localField:'so_db_id',
        foreignField:'_id',
        as:'salesOrder'
      }
    }, 
    // {
    //   $group: {
    //     _id: '$salesOrderId',
    //     totalSalesOrder:{$sum:1},
    //     salesData: {
    //       $push: '$$ROOT'
    //     }
       
    //   }
    // },
    
    {
      $project:{
_id:0
      }
    },
    // {
    //   $group: {
    //     _id: '$spotSalesId',
    //     totalSalesOrder:{$sum:1},
    //     spotSales: {
    //       $push: '$$ROOT'
    //     }
      
    //   }
    // },
   
 

    ]
    let invoiceData =await invoiceMasterModel.aggregate(pipeline);
    // find().populate('spotSalesId vehicleId salesOrderId');
  
  

    try {
      info('generating GPN!');
      
//  DE ID,Invoice ID,Trip ID,SO ID,invoice_no
      let objToEncode = {
        'deliverExecutiveId':deliveryExecutiveId,
        // 'invoice_id':[mongoose.Types.ObjectId('5ff4161a56742a7178ed445d')],
        // 'trip_id':mongoose.Types.ObjectId('5ff4161a56742a7178ed445d'),
        // 'salesOrderId':[mongoose.Types.ObjectId('5ff4161a56742a7178ed445d3')],
        'invoiceNumber':['INV-123'],
        'gpn':uuidv4(),
        // 'sales_order_no':['SO-123'],
        'order_date':'20/02/2021',
        // 'spotSalesId':'5ff4161a56742a7178ed445d',
        'isVerify':isVerify,
        'isDeleted':0,
        'crateCount':parseInt(crateIn)

      }

      let gpnData = gpnModel.generateGpn(objToEncode)
      let qr = await QRCode.toDataURL(JSON.stringify(objToEncode),{type:'terminal'}); //Generate Base64 encode QR code String
     
      // invoiceData[0]['qr']=Buffer.from(qr).toString('base64');
      invoiceData[0]['qr'] = qr;
      invoiceData[0]['isverify'] = isVerify||0;
      
      console.log(qr);
      
     
      this.success(req, res, this.status.HTTP_OK, 
        invoiceData || []
      , this.messageTypes.deliveryExecutiveGPNGeneratedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }


  }


  getInvoiceByNumber = async (req,res,next)=>{
    let user = req.user, // user 
    deliveryExecutiveId = user._id
    let invoiceId = req.query.invoiceId ;
    let invoiceNo = req.query.invoiceno || 0;




    let pipeline = [
      {
        $match:{
          $or:[
          {'_id':mongoose.Types.ObjectId(invoiceId)},
          {'invoiceDetails.invoiceNo':invoiceNo}
          ]
        }
      },{
        $lookup:{
          from:'spotSales',
          localField:'spotSalesId',
          foreignField:'_id',
          as:'spotSales'
        }
      }
    ]
    let invoiceDetail = await invoiceMasterModel.aggregate(pipeline)


    try {
      info('Getting invoice Detail!');
      
  
      // success response 
      this.success(req, res, this.status.HTTP_OK, 
        invoiceDetail || []
      , this.messageTypes.deliveryExecutiveInvoiceFetchedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }


  updateOdometerReading = async (req,res,next)=>{
    let ID = parseInt(req.params.tripid);
    let user = req.user, // user 
  deliveryExecutiveId = user._id
    
    let updateObject = {
      startOdometerReading:parseInt(req.body.odometerreading),
      isTripStarted:1,
      isActive:1

    }

    let odometerReading = await tripModel.findOneAndUpdate({
      'tripId': ID
      
    },
      {
        $set: updateObject
      }, {
      
      'new': true
    });



    try {
      info('Getting invoice Detail!');
      
  
      // success response 
      this.success(req, res, this.status.HTTP_OK, 
        odometerReading || []
      , this.messageTypes.deliveryExecutiveOdometerReadingUpdatedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }



getInTrip = async (req,res,next)=>{
  let user = req.user, // user 
  deliveryExecutiveId = user._id
  let pipeline = [{
    $match:{$and:[{'transporterDetails.deliveryExecutiveId':mongoose.Types.ObjectId(deliveryExecutiveId)},
    {
      'isActive':1
    }
  ]
  }
  }]

  let activeTripData = await tripModel.find({$and:[{'transporterDetails.deliveryExecutiveId':mongoose.Types.ObjectId(deliveryExecutiveId)},
  {
    'isActive':1
  }
]
}).populate('spotSalesId vehicleId salesOrderId');
  

  try {
    info('Getting invoice Detail!');
    

    // success response 
    this.success(req, res, this.status.HTTP_OK, 
      activeTripData || []
    , this.messageTypes.deliveryExecutiveInTripDataFetchedSuccessfully);

    // catch any runtime error 
  } catch (err) {
    error(err);
    this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  }
}



// delivery EXecutive history

getHistory = async (req,res,next)=>{
  let user = req.user, // user 
  deliveryExecutiveId = user._id,
  pageNumber = parseInt(req.query.page) || 1,
  pageSize = 10;


  let pipeline = [
    {$match:{$and:[{
      'transporterDetails.deliveryExecutiveId':deliveryExecutiveId
    },
    {
      'isCompleteDeleiveryDone':0
    }
    // {
    // delivery executive todays trip field
    // }
  ]
}
},
    {
    $skip:(pageSize*(pageNumber-1))
    },
    {
      $limit:pageNumber}
  ]

  let historyData = await tripModel.aggregate(pipeline)
 

  try {
    info('Getting History Detail!');
    

    // success response 
    this.success(req, res, this.status.HTTP_OK, 
      historyData || []
    , this.messageTypes.deliveryExecutiveHistoryDataFetchedSuccessfully);

    // catch any runtime error 
  } catch (err) {
    error(err);
    this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  }
}



updateItemStatusAndCaretOut = async (req,res,next)=>{
  let _id = req.params.id;
  let crateOut = req.body.crateOut || req.body.crateout  || 0;
  let crateOutWithItem = req.body.crateOutWithItem || req.body.crateoutwithitem  || 0;
  // let itemDeliveryStatus = req.body.itemDeliveryStatus || req.body.itemdeliverystatus  || 0;
  // let RejecteditemQuantity = req.body.rejectedQuantity || req.body.rejectedquantity  || 0;
  // let comment = req.body.rejectedQuantity || req.body.rejectedquantity  || 0;
  let orderItems = req.body.itemdata || req.body.itemData || []
  let updatedOrderDetail ;
  let caretDetailUpdated;
    // sales order update crate

    try {
      caretDetailUpdated = await salesOrderModel.update(
        {
          '_id': mongoose.Types.ObjectId(_id)
        },{

      $inc: 
             {
                'crateIn': -((crateOut + crateOutWithItem))
              },
              // 'orderItems.rejectedQuantity':RejecteditemQuantity,
              // 'orderItems.itemDeliveryStatus':itemDeliveryStatus,
              'crateOut':crateOut,
              'crateOutWithItem':crateOutWithItem
            })

    orderItems.forEach(async (item,index)=>{
      console.log('item',item)
      let updateObj = {
        'orderItems.$.itemDeliveryStatus':item.itemDeliveryStatus||item.itemdeliverystatus||0,
        'orderItems.$.rejectedQuantity':item.RejectedQuantity||item.rejectedquantity||0,
        'orderItems.$.comments':item.comments||item.Comments||''
    
      }
    
     
         updatedOrderDetail = await salesOrderModel.update(
          {
            '_id': mongoose.Types.ObjectId(_id) ,
            'orderItems._id':mongoose.Types.ObjectId(item.id)
          
            
          },
          {$set: {...updateObj} 
          // {
          //    $inc: 
          //    {
          //       'crateIn': -((crateOut + crateOutWithItem))
          //     },
          //     // 'orderItems.rejectedQuantity':RejecteditemQuantity,
          //     // 'orderItems.itemDeliveryStatus':itemDeliveryStatus,
          //     'crateOut':crateOut,
          //     'crateOutWithItem':crateOutWithItem,
              
          //     // {$set: {levels.$.questions.$: upQstnObj} 
    
          //     // }
          //   }
    
    
              
             }
       )
        
    
      //  sales order update end

    });
    
 


 
    info('Delivery Status Updating!');
    

    // success response 
    this.success(req, res, this.status.HTTP_OK, 
      updatedOrderDetail || []
    , this.messageTypes.deliveryExecutiveDeliveryStatusUpdateSuccessfully);

    // catch any runtime error 
  } catch (err) {
    error(err);
    this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  }
}


}


module.exports = new DeliveryExecutivetrip();