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
const sales_orderController = require('../../sales_order/sales_order/sales_order.controller');

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
  //remark for partial need to added
  //set next delivery date
  addItems = async (req, res) => {
    try {
      info('Add items after scanning  !');
      let pickerBoySalesOrderMappingId = mongoose.Types.ObjectId(req.params.pickerBoySalesOrderMappingId) || '',
        quantityAdded = req.body.quantity,
        mrp_amount = parseInt(req.body.itemDetail.mrp_amount),
        isEdit = parseInt(req.query.isEdit) || parseInt(req.query.isedit) || 0,
         isInserted
      //itemID->material
      // console.log('name',req.body.itemDetail.sold_to_party_description)
      let dataToInsert = {
        'pickerBoySalesOrderMappingId': pickerBoySalesOrderMappingId,
        'isDeleted': 0,
        'status': 1,
        'itemDetail': [{
          'item_no': req.body.item_no,
          // 'itemName': req.body.sold_to_party_description,
          'material_no': req.body.itemDetail.material_no,
          'itemName': req.body.itemDetail.material_description ? req.body.itemDetail.material_description : 'N/A',
          'partialItemRemark': req.body.remarks,
          'mrp_amount': mrp_amount,
          'uom': req.body.itemDetail.uom,
          'discount_amount': req.body.itemDetail.discount_amount ? req.body.itemDetail.discount_amount : 0,
          'plant': req.body.plant,
          'cgst-pr': req.body.itemDetail.cgst_pr,
          'sgst_pr': req.body.itemDetail.sgst_pr,
          'igst_pr': req.body.itemDetail.igst_pr,
          'ugst_pr': req.body.itemDetail.ugst_pr,
          'pickedQuantity': quantityAdded,
          'total_amount': req.body.itemDetail.total_amount,
          'totalQuantity': parseInt(req.body.itemDetail.qty),
          'storage_location': req.body.itemDetail.storage_location ? req.body.itemDetail.storage_location : "100",
          'requireQuantity': ((parseInt(req.body.itemDetail.qty)) - (parseInt(req.body.itemDetail.suppliedQty ? req.body.itemDetail.suppliedQty : 0))), //- parseInt(req.body.itemDetail.suppliedQty)),
          'suppliedQty': (parseInt(req.body.itemDetail.suppliedQty ? req.body.itemDetail.suppliedQty : 0)), //req.body.itemDetail.suppliedQty, //previous supplied
          // 'taxPercentage': req.body.itemDetail.taxPercentage,
          'discountPercentage': req.body.itemDetail.discountPercentage ? req.body.itemDetail.discountPercentage : 0,
          'freeQty': req.body.itemDetail.freeQty ? req.body.itemDetail.freeQty : 0,
          'itemAmount': (mrp_amount * quantityAdded)
        }],
        'createdBy': req.user.email

      };

      // inserting data into the db 
      if (!isEdit) {
         isInserted = await Model.addItem(dataToInsert);
      } else {
         isInserted = await Model.update({
          'pickerBoySalesOrderMappingId': pickerBoySalesOrderMappingId,
          'isDeleted': 0,
          'status': 1, "itemDetail.item_no": req.body.item_no
        }, { $set: { "itemDetail.$.pickedQuantity": quantityAdded ,'itemDetail.$.partialItemRemark': req.body.remarks} });
      }


      // console.log(orderDetail)


      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        await pickerBoySalesOrderModel.updateIsItemPickedStatus(pickerBoySalesOrderMappingId, true)

        let itemAdded = await Model.getItemAddedByPickerBoyId(pickerBoySalesOrderMappingId)
        // getOrderByPickerBoyId
        let orderDetail = await pickerBoySalesOrderModel.getOrderByPickerBoyId(pickerBoySalesOrderMappingId)



        // changes required quadratic
        if (orderDetail.length > 0 && itemAdded.length > 0) {
          orderDetail[0]['salesOrderId']['item'].forEach((x, i) => {
            //   console.log(x)
            
            orderDetail[0]['salesOrderId']['item'][i].isItemPicked = false;
            itemAdded[0]['itemDetail'].forEach((y, j) => {
              if (x.item_no === y.item_no) {
                orderDetail[0]['salesOrderId']['item'][i] = y;

              }
            })
            orderDetail[0]['salesOrderId']['item'][i]['qty'] = parseInt(orderDetail[0]['salesOrderId']['item'][i]['qty']-parseInt(orderDetail[0]['salesOrderId']['item'][i]['suppliedQty']?orderDetail[0]['salesOrderId']['item'][i]['suppliedQty']:0))
          })
        }

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
          'itemDetail.$': { ...req.body.toChangeObject }
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
      // console.log(pickerBoySalesOrderMappingId,itemId)
      // get details 
      return Model.findOne({
        pickerBoySalesOrderMappingId: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId),
        'itemDetail.item_no': itemId,
        isDeleted: 0
      }).lean().then((res) => {
        // console.log(res)
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
        { multi: true }

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






  getBucketDetail = async (req, res, next) => {

    info('Get Bucket Item details !');
    try {

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




      // console.log('Sales order',orderDetail[0]['salesOrderId']['item'])

      // check if inserted 
      if (orderDetail) {


        // changes required quadratic
        if (orderDetail) {

          orderDetail[0]['salesOrderId']['item'].forEach((x, i) => {
            //   console.log(x)
            orderDetail[0]['salesOrderId']['item'][i]['remainingQty'] = parseInt(orderDetail[0]['salesOrderId']['item'][i]['qty']-parseInt(orderDetail[0]['salesOrderId']['item'][i]['suppliedQty']?orderDetail[0]['salesOrderId']['item'][i]['suppliedQty']:0))
            orderDetail[0]['salesOrderId']['item'][i].isItemPicked = false;
            if (itemAdded) {
              itemAdded[0]['itemDetail'].forEach((y, j) => {
                if (x.item_no === y.item_no) {

                  orderDetail[0]['salesOrderId']['item'][i] = y;
                  orderDetail[0]['salesOrderId']['item'][i]['qty']=y['totalQuantity'];
                  // orderDetail[0]['salesOrderId']['orderItems'][i].itemAmount=y.itemAmount;

                  // orderDetail[0]['salesOrderId']['orderItems'][i].isItemPicked=y.isItemPicked;

                }
              })
            }
          })
        }

        // orderDetail[0]['salesOrderId']['item'].forEach((items,i)=>{
        //   items['item'].forEach((item,j)=>{
        //     console.log(parseInt(item.qty),parseInt(item.suppliedQty?item.suppliedQty:0),(parseInt(item.qty)-parseInt(item.suppliedQty?item.suppliedQty:0)))
        //   todaysOrderData[i]['item'][j]['qty'] = (parseInt(item.qty)-parseInt(item.suppliedQty?item.suppliedQty:0)).toString()
        //   if((item.fulfillmentStatus?item.fulfillmentStatus:0)==2){
        //     console.log(todaysOrderData[i]['item'][j])
        //     // todaysOrderData[i]['item'].splice(j, 1)
        //     let status = (item.fulfillmentStatus?item.fulfillmentStatus:0)
        //     _.remove(todaysOrderData[i]['item'],{'fulfillmentStatus':2})

        //   }
        //   })
        // })


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

  //Return all item picked by pickerboy 
  getPickedItemByPickerOrderId = async (pickerBoyOrderMappingId) => {

    try {
      info('Fetching Picked Item Details !');

      // get details 
      return Model.find({
        pickerBoySalesOrderMappingId: mongoose.Types.ObjectId(pickerBoyOrderMappingId)
      }


      ).lean().populate({
        path: 'pickerBoySalesOrderMappingId', populate: { path: 'salesOrderId' }, select: {

          'invoiceDetail': 0,
          'isDeleted': 0,
          'status': 0,

          'pickerBoySalesOrderMappingId.invoiceDetail': 0,
          'pickerBoySalesOrderMappingId.isDeleted': 0,
          'pickerBoySalesOrderMappingId.pickerBoyId': 0,
          'pickerBoySalesOrderMappingId.createdAt': 0,
          'pickerBoySalesOrderMappingId.updatedAt': 0,
          'pickerBoySalesOrderMappingId.__v': 0,


        }
      }).lean().then((res) => {
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

   //Update SO status and inv detail.Check hooks for INV generate method
   generateInvV2 = async (req, res, next) => {
    try {
      let OrderData = req.body.orderDetail
      // invoiceDetail = req.body.invoice_detail['data'][0]


      // sales_orderController.UpdateSalesOrderFullfilmentStatusAndSuppliedQuantityOld(OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['_id'], OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['item'], req.body.invoice_detail)
      //  salesOrderId: {
      //   _id: 606901f99429dd62745df225,

      // itemDetail{
      //   totalQuantity: 1,
      // requireQuantity: 1,
      // suppliedQty: 0,
      // }
        req.body.invDetail['itemSupplied'].forEach((data,i)=>{
        OrderData['itemDetail'].forEach((item,j) => {
          // console.log('item_no',data.item_no,item.item_no)
          if(data.item_no==item.item_no){

            req.body.invDetail['itemSupplied'][i]['material_description'] = item['itemName']
          }



        })

      })
      // console.log(req.body.invDetail['itemSupplied'])

      info('Invoice Generated and updated to DB !');
      if (req.body.invDetail) {
        return this.success(req, res, this.status.HTTP_OK,
          // req.body.invoice_detail
          req.body.invDetail,
          this.messageTypes.InvoiceGeneratedSuccesfully);
      }



      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.InvoiceUpdateFailed);


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }


  //Update SO status and inv detail.Check hooks for INV generate method
  generateInv = async (req, res, next) => {
    try {
      let OrderData = req.body.orderDetail
      // invoiceDetail = req.body.invoice_detail['data'][0]


      sales_orderController.UpdateSalesOrderFullfilmentStatusAndSuppliedQuantityOld(OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['_id'], OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['item'], req.body.invoice_detail)
      //  salesOrderId: {
      //   _id: 606901f99429dd62745df225,

      // itemDetail{
      //   totalQuantity: 1,
      // requireQuantity: 1,
      // suppliedQty: 0,
      // }
        req.body.invDetail['itemSupplied'].forEach((data,i)=>{
        OrderData['itemDetail'].forEach((item,j) => {
          // console.log('item_no',data.item_no,item.item_no)
          if(data.item_no==item.item_no){

            req.body.invDetail['itemSupplied'][i]['material_description'] = item['itemName']
          }



        })

      })
      // console.log(req.body.invDetail['itemSupplied'])

      info('Invoice Generated and updated to DB !');
      if (req.body.invDetail) {
        return this.success(req, res, this.status.HTTP_OK,
          // req.body.invoice_detail
          req.body.invDetail,
          this.messageTypes.InvoiceGeneratedSuccesfully);
      }



      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.InvoiceUpdateFailed);


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

  pickingAllocation = async (req, res, next) => {



    try {
      let OrderData = req.body.orderDetail,
        pickedItem = OrderData['itemDetail'];
      req.body.delivery_detail['data']['retryCount'] = 0;
      // invoiceDetail = req.body.invoice_detail['data'][0]
      let pickerBoyOrderMappingId = req.params.pickerBoyOrderMappingId, // type 
        deliveryDetail = req.body.delivery_detail['data'] || undefined;


      //update delivery date
      console.log('delivery', OrderData['itemDetail'])
      let soUpdateFullfilemt = await sales_orderController.UpdateSalesOrderFullfilmentStatusAndSuppliedQuantity(OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['_id'], OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['item'], pickedItem, req.body.deliveryDate)



      info('Picking Allocation is created !');
      if (soUpdateFullfilemt.success) {
        console.log('success')
        let updateStatus = await pickerBoySalesOrderModel.updateFullfilmentStatus(OrderData['pickerBoySalesOrderMappingId']['_id'], soUpdateFullfilemt['data']['fulfillmentStatus'])

        console.log('updateStatus', updateStatus)
        return this.success(req, res, this.status.HTTP_OK,

          deliveryDetail,
          this.messageTypes.PickingAllocationGeneratedSuccesfully);
      }



      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.PickingUpdateFailed);


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }



  //Fetch pending invoice,picking is done 
  getpickingallocation = async (req, res, next) => {
    let orderModel
    try {

      info('Getting the pending Invoice !!!');
      console.log(req.user)
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = '', //req.query.search ||,
        fullfilment = parseInt(req.query.fullfilment) || 2,
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||
        searchDate = req.body.searchDate || '',
        type = req.params.type,
        pickerBoyId = req.user._id,
        plant = req.user.plant,
        sortingArray = {};
      sortingArray[sortBy] = -1;







      if (searchDate && !_.isEmpty(searchDate)) {


        startOfTheDay = moment(searchDate).format('YYYY-MM-DD')

        // getting the end of the day 
        endOfTheDay = moment(searchDate).format('YYYY-MM-DD')
      }

      let pipeline = [{
        $match: {
          
          'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId),
          'state': 1,
          $or: [
            
            {
              'isSapError':

                { $exists: true, $ne: 'DNE' }
            }
            // {
            //   'isSapError': { $exists: false }

            // }
          ],
          'fullfilment': fullfilment,
          'delivery_no': {
            $ne: 'N/A'
          }





        }
      },
      {
        $project: {
          '_id': 1,
          'delivery_no': 1,
          'sales_order_no': 1,
          'delivery_date': 1,
          'fullfilment': 1,

          'itemCount': '$$ROOT.fullfilment'


        }
      },
      {
        $sort: {
          'created_at': -1
        }
      }, {
        $skip: (pageSize * (page - 1))
      }, {
        $limit: pageSize
      }];

      // creating a match object
      if (searchKey !== '')
        pipeline = [{
          $match: {
            'invoiceDetail.isInvoice': false,
            'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId),
            'isSapError': 'INVE',
            'fullfilment': fullfilment,
            'delivery_no': {
              $ne: 'N/A'
            }


          }
        }, {
          $sort: {
            'created_at': -1
          }
        },
        {
          $skip: (1 * (page - 1))
        }, {
          $limit: 1
        }];




      // get list







      let totalPendingInvoice = await pickerBoySalesOrderModel.aggregate([{
        $match: {
          'invoiceDetail.isInvoice': false,
          'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId),
          'isSapError': 'INVE',
          'fullfilment': fullfilment,
          'delivery_no': {
            $ne: 'N/A'
          }


        }
      }])

      let pendingInvoice = await pickerBoySalesOrderModel.aggregate(pipeline)
      // let todaysOrderData = await orderModel.find({'req_del_date':'2021-03-29'})
      console.log(pendingInvoice)



      if (pendingInvoice.length > 0) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: pendingInvoice,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalPendingInvoice.length  //item
          }
        }, this.messageTypes.pendingAllocationFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedPendingAllocation);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // remove item from bucket
  removeItemFromBucket = async (req, res, next) => {
    // .update({pickerBoySalesOrderMappingId:ObjectId("60e2902e4b34ff0f0534a264")},{ $pull: { "itemDetail": { 'item_no': "000020" } } })
    try {
      info('Remove Bucket item!');
      let bucketId = req.params.pickerBoySalesOrderMappingId,
        itemNumber = req.body.item_no;
      // materialNumber = req.body.materialNumber;
      let isRemoved = await Model.update({
        pickerBoySalesOrderMappingId: mongoose.Types.ObjectId(bucketId)
      },
        {
          $pull: {
            "itemDetail":
              { 'item_no': { $in: itemNumber } }
          }
        })

      if (isRemoved && !_.isEmpty(isRemoved)) {
        // console.log('test',res['pickerBoySalesOrderMappingId'])
        return this.success(req, res, this.status.HTTP_OK,
          {
            results: isRemoved,

          }, 'Material Succesfully Removed from Bucket.');
      } else {
        error('Error while Removing Item from Bucket/Cart !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchBucketItemList);
      }


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  clearBucket = async (req, res, next) => {
    try {

      info('Clear Bucket!')
      let bucketId = req.params.pickerBoySalesOrderMappingId
    
      let isBucketClear = await pickerBoySalesOrderModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(bucketId) },
        { $set: { 'isDeleted': 1, 'status': 0,'isItemPicked':false,'isStartedPicking':false} })

      if (isBucketClear && !_.isEmpty(isBucketClear)) {
        // console.log('test',res['pickerBoySalesOrderMappingId'])
        return this.success(req, res, this.status.HTTP_OK,
          {
            results: isBucketClear,

          }, 'Bucket Succesfully Removed.');
      } else {
        error('Error while Clearing Bucket/Cart !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchBucketItemList);
      }

    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));


    }
  }












}

// exporting the modules 
module.exports = new pickerSalesOrderMappingController();
