// controllers 
const SalesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
const PockerBoyCtrl = require('../../employee/picker_boy/picker_boy.controller');
const AttendanceCtrl = require('../onBoard/app_picker_user_attendance/app_picker_user_attendance.controller');
const pickerboySalesOrderMappingController = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const pickerBoySalesOrderModel = require('../pickerboy_salesorder_mapping/models/pickerboy_salesorder_mapping.model');
const BaseController = require('../../baseController');
const Model = require('./models/pickerboy_salesorder_items_mapping.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');

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
      let pickerBoySalesOrderMappingId = mongoose.Types.ObjectId(req.params.pickerBoySalesOrderMappingId) || '',
      quantityAdded = req.body.quantity,
      mrp_amount = parseInt(req.body.itemDetail.mrp_amount)
   
      //itemID->material

      let dataToInsert = {
        'pickerBoySalesOrderMappingId': pickerBoySalesOrderMappingId,
        'itemDetail':[{
        'item_no': req.body.item_no,
        'material_no':req.body.itemDetail.material_no,
        'itemName': req.body.itemDetail.itemName?req.body.itemDetail.itemName:'N/A',
        
        'mrp_amount':mrp_amount,
        'uom':req.body.itemDetail.uom,
        'discount_amount': req.body.itemDetail.discount_amount?req.body.itemDetail.discount_amount:0,
        'plant':req.body.plant,
        'cgst-pr':req.body.itemDetail.cgst_pr,
        'sgst_pr':req.body.itemDetail.sgst_pr,
        'igst_pr':req.body.itemDetail.igst_pr,
        'ugst_pr':req.body.itemDetail.ugst_pr,
        'pickedQuantity': quantityAdded,
        'total_amount':req.body.itemDetail.total_amount,
        'totalQuantity':parseInt(req.body.itemDetail.qty),
        'requireQuantity':(parseInt(req.body.itemDetail.qty)), //- parseInt(req.body.itemDetail.suppliedQty)),
        'suppliedQty':  0, //req.body.itemDetail.suppliedQty, //previous supplied
        // 'taxPercentage': req.body.itemDetail.taxPercentage,
        'discountPercentage': req.body.itemDetail.discountPercentage?req.body.itemDetail.discountPercentage:0,
        'freeQty': req.body.itemDetail.freeQty?req.body.itemDetail.freeQty:0,
        'itemAmount': (mrp_amount*quantityAdded)  
      }],
        'createdBy':  req.user.email

      };

      // inserting data into the db 
      let isInserted = await Model.addItem(dataToInsert);
  
  
      // console.log(orderDetail)


      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        await pickerBoySalesOrderModel.updateIsItemPickedStatus(pickerBoySalesOrderMappingId,true)
     
        let itemAdded = await Model.getItemAddedByPickerBoyId(pickerBoySalesOrderMappingId)
        // getOrderByPickerBoyId
        let orderDetail = await pickerBoySalesOrderModel.getOrderByPickerBoyId(pickerBoySalesOrderMappingId)
     
    
        console.log('orderItemsssss',Object.keys(orderDetail[0]['salesOrderId']))
         // changes required quadratic
      if(orderDetail.length>0 && itemAdded.length>0){
        orderDetail[0]['salesOrderId']['item'].forEach((x,i)=>{
        //   console.log(x)
        itemAdded[0]['itemDetail'].forEach((y,j)=>{
            if(x.item_no ===y.item_no){
              orderDetail[0]['salesOrderId']['item'][i]=y;
              // orderDetail[0]['salesOrderId']['orderItems'][i].itemAmount=y.itemAmount;
              // orderDetail[0]['salesOrderId']['orderItems'][i].isItemPicked=y.isItemPicked;
            }
        })
      })}
 
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
  // Internal Function to delete cart items when invoice is generated
  deleteCartItems = (pickerBoySalesOrderMappingId, itemId) => {
    try {
      info('delete cart items after invoice is generated !');

      // get details 
      return Model.update({
        pickerBoySalesOrderMappingId: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId)
        },
       {
         $set: { 
           isDeleted: 1,
           status: 0
          } 
        },
       {multi: true }

      ).then((res) => {
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

      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt';
      let sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;
  
      let itemId = req.body.itemId, // itemId  
    pickerBoySalesOrderMappingId = req.params.pickerBoySalesOrderMappingId || '';


    let itemAdded = await Model.getItemAddedByPickerBoyId(pickerBoySalesOrderMappingId)
    // getOrderByPickerBoyId
    let orderDetail = await pickerBoySalesOrderModel.getOrderByPickerBoyId(pickerBoySalesOrderMappingId); 
    // pickerboySalesOrderMappingController.getOrderDetail(pickerBoySalesOrderMappingId)
 


    
    console.log('Sales order',orderDetail[0]['salesOrderId']['item'])

    // check if inserted 
    if (orderDetail ) {
  
     
       // changes required quadratic
    if(itemAdded){
      
      orderDetail[0]['salesOrderId']['item'].forEach((x,i)=>{
      //   console.log(x)
      itemAdded[0]['itemDetail'].forEach((y,j)=>{
          if(x.item_no ===y.item_no){
            
            orderDetail[0]['salesOrderId']['item'][i]=y;
            // orderDetail[0]['salesOrderId']['orderItems'][i].itemAmount=y.itemAmount;
            
            // orderDetail[0]['salesOrderId']['orderItems'][i].isItemPicked=y.isItemPicked;
           
          }
      })
    })
  }
      return this.success(req, res, this.status.HTTP_OK, 
        {
          results: orderDetail,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: orderDetail[0]['salesOrderId']['item'].length
          }
        }, this.messageTypes.bucketItemListFetchSuccesfully);
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


  getPickedItemByPickerOrderId = async (pickerBoyOrderMappingId)=>{
    
    try {
      info('test !');

      // get details 
      return Model.find({
        pickerBoySalesOrderMappingId: mongoose.Types.ObjectId(pickerBoyOrderMappingId)
        }
     

      ).populate({path:'pickerBoySalesOrderMappingId',populate:{path:'salesOrderId'},select:{
        'salesOrderId':0,
        'invoiceDetail': 0,
        'isDeleted': 0,
        'status': 0,
        '_id': 0,
        'pickerBoySalesOrderMappingId.invoiceDetail': 0,
        'pickerBoySalesOrderMappingId.isDeleted':0,
        'pickerBoySalesOrderMappingId.pickerBoyId':0,
        'pickerBoySalesOrderMappingId.createdAt':0,
        'pickerBoySalesOrderMappingId.updatedAt':0,
        'pickerBoySalesOrderMappingId.__v':0,
        // {
        //   invoiceDetail: [Object],
        //   isStartedPicking: true,
        //   isItemPicked: false,
        //   state: 0,
        //   isDeleted: 0,
        //   status: 1,
        //   _id: 605f6d904a28e55420b4fe5d,
        //   pickerBoyId: [Object],
        //   createdBy: 'krishna.agrawal@waycool.in',
        //   pickingDate: 2021-03-27T17:38:24.284Z,
        //   createdAt: 2021-03-27T17:38:24.296Z,
        //   updatedAt: 2021-03-27T19:12:52.293Z,
        //   __v: 0
        // },
        // itemDetail: [ [Object] ],
        // createdBy: 'krishna.agrawal@waycool.in',
        // createdAt: 2021-03-27T18:20:06.706Z,
        // updatedAt: 2021-03-27T19:12:52.263Z,
      
      }}).then((res) => {
        if (res && !_.isEmpty(res)) {
          console.log('test',res)
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



  generateInv = async (req,res,next)=>{
    try {
      info('Invoice Generated and updated to DB !');
      if(req.body.invDetail){
        return  this.success(req, res, this.status.HTTP_OK, 
          {
            results: req.body.invDetail,
        
          }, this.messageTypes.InvoiceGeneratedSuccesfully);
      }

      
    
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.InvoiceUpdateFailed);

      
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }





  // generateDelivery = async (req,res,next)=>{

  // }


}

// exporting the modules 
module.exports = new pickerSalesOrderMappingController();
