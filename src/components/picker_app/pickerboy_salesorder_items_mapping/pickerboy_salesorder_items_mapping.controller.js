// controllers 
const SalesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
const PockerBoyCtrl = require('../../employee/picker_boy/picker_boy.controller');
const AttendanceCtrl = require('../onBoard/app_picker_user_attendance/app_picker_user_attendance.controller');

const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/pickerboy_salesorder_items_mapping.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const pickerboySalesOrderMappingController = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
const {
  error,
  info
} = require('../../../utils').logging;

// self apis
const {

} = require('../../../third_party_api/self');

// We are using timeout because the Flow is synchronised and inorder to get the final report we need to wait for 5 secs 
class timeout {
  sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}

// getting the model 
class pickerSalesOrderMappingController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.salesOrder;
  }


  //adding the new items after each scan
  addItems = async (req, res) => {
    try {
      info('Add items after scanning  !');
      let pickerBoySalesOrderMappingId = req.params.pickerBoySalesOrderMappingId || '',
      suppliedQty = req.body.suppliedQty,
      salesPrice = req.body.itemDetail.salePrice
      // itemDetail {
      //   _id: 6023d4cce4cd267f8e794637,
      //   rowNo: 1,
      //   id: 76600,
      //   itemId: 3700,
      //   itemName: 'MADHURAM  RAW RICE DELUXE',
      //   itemReferenceCode: '3700',
      //   salePrice: 43,
      //   quantity: 25,
      //   suppliedQty: '25.00',
      //   itemAmount: 1075,
      //   iBarU: 0,
      //   taxPercentage: 0,
      //   itemTaxType: '',
      //   discountPercentage: 0,
      //   itemRemarks: '',
      //   itemMarketPrice: 43,
      //   freeQty: 0,
      //   orderPK: 168177
      // }

      

      let dataToInsert = {
        'pickerBoySalesOrderMappingId': pickerBoySalesOrderMappingId,
        'itemDetail':[{
        'itemId': req.body.itemId,
        'itemName': req.body.itemDetail.itemName,
        'salePrice': salesPrice,
        'quantity': req.body.itemDetail.quantity,
        'suppliedQty': suppliedQty,
        'taxPercentage': req.body.itemDetail.taxPercentage,
        'discountPercentage': req.body.itemDetail.discountPercentage,
        'freeQty': req.body.itemDetail.freeQty,
        'itemAmount': (salesPrice*suppliedQty)
      }],
        'createdBy':  'admin@waycool.in'           //req.user.email

      };

      // inserting data into the db 
      let isInserted = await Model.addItem(dataToInsert);
  
  
      console.log(orderDetail)


      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        pickerboySalesOrderMappingController.updateItemPickStatus(pickerBoySalesOrderMappingId,true)
     
        let itemAdded = await Model.getItemAddedByPickerBoyId(pickerBoySalesOrderMappingId)
        // getOrderByPickerBoyId
        let orderDetail = await pickerboySalesOrderMappingController.getOrderDetail(pickerBoySalesOrderMappingId)
     
         // changes required quadratic
      
        orderDetail[0]['salesOrderId']['orderItems'].forEach((x,i)=>{
        //   console.log(x)
        itemAdded[0]['itemDetail'].forEach((y,j)=>{
            if(x.itemId ===y.itemId){
              orderDetail[0]['salesOrderId']['orderItems'][i].suppliedQty=y.suppliedQty;
              orderDetail[0]['salesOrderId']['orderItems'][i].itemAmount=y.itemAmount;
              orderDetail[0]['salesOrderId']['orderItems'][i].isItemPicked=y.isItemPicked;
            }
        })
      })
 
        return this.success(req, res, this.status.HTTP_OK, orderDetail, this.messageTypes.itemAddedInsalesOrderAfterScan);
      } else {
        error('Error while adding in packing collection !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToAddItemInsalesOrderAfterScan);
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
// not working
  // patch the request 
  patchItems = async (req, res) => {
    try {
      info('Item PATCH REQUEST !');
      let itemId = req.body.itemId, // itemId  
        pickerBoySalesOrderMappingId = req.params.pickerBoySalesOrderMappingId || '';
      // creating data to insert
      let dataToUpdate = {
        $set: {
         'itemDetail.$':{...req.body.toChangeObject}
        }
      };

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        pickerBoySalesOrderMappingId: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId),
        'itemDetail.itemId': itemId,
        isDeleted: 0
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      });

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.brandUpdatedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.brandNotUpdated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // Internal Function get customer details 
  getAddedItemDetails = (pickerBoySalesOrderMappingId, itemId) => {
    try {
      info('Get Added Item details !');
console.log(pickerBoySalesOrderMappingId,itemId)
      // get details 
      return Model.findOne({
        pickerBoySalesOrderMappingId: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId),
        'itemDetail.itemId': itemId,
        isDeleted: 0
      }).lean().then((res) => {
        console.log(res)
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching item in PickerBoy Item SalesOrder Mapping DB!');
          return {
            success: false
          }
        }
      }).catch(err => {
        error(err);
        return {
          success: false,
          error: err
        }
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }



  getBucketDetail=async (req,res,next)=>{

    info('Get Bucket Item details !');
    try{
      let itemId = req.body.itemId, // itemId  
    pickerBoySalesOrderMappingId = req.params.pickerBoySalesOrderMappingId || '';


    let itemAdded = await Model.getItemAddedByPickerBoyId(pickerBoySalesOrderMappingId)
    // getOrderByPickerBoyId
    let orderDetail = await pickerboySalesOrderMappingController.getOrderDetail(pickerBoySalesOrderMappingId)
 


    


    // check if inserted 
    if (orderDetail) {
  
     
       // changes required quadratic
    
      orderDetail[0]['salesOrderId']['orderItems'].forEach((x,i)=>{
      //   console.log(x)
      itemAdded[0]['itemDetail'].forEach((y,j)=>{
          if(x.itemId ===y.itemId){
            orderDetail[0]['salesOrderId']['orderItems'][i].suppliedQty=y.suppliedQty;
            orderDetail[0]['salesOrderId']['orderItems'][i].itemAmount=y.itemAmount;
            
            orderDetail[0]['salesOrderId']['orderItems'][i].isItemPicked=y.isItemPicked;
           
          }
      })
    })
 
      return this.success(req, res, this.status.HTTP_OK, orderDetail, this.messageTypes.bucketItemListFetchSuccesfully);
    } else {
      error('Error while adding in packing collection !');
      return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchBucketItemList);
    }
    // catch any runtime error 
  } catch (err) {
    error(err);
    this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  }

  }


}

// exporting the modules 
module.exports = new pickerSalesOrderMappingController();
