// controllers 
const SalesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
const PickerBoyCtrl = require('../../employee/picker_boy/picker_boy.controller');
const AttendanceCtrl = require('../onBoard/app_picker_user_attendance/app_picker_user_attendance.controller');
const salesOrderModel= require('../../sales_order/sales_order/models/sales_order.model')
const salesOrderInvMappingModel = require('../../MyTrip/assign_trip/model/salesOrder.model');
const salesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
const spotSalesModel= require('../../MyTrip/assign_trip/model/spotsales.model');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const invMasterCtrl = require('../invoice_master/invoice_master.controller');
const BaseController = require('../../baseController');
const Model = require('./models/pickerboy_salesorder_mapping.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const {
  error,
  info
} = require('../../../utils').logging;
//DMS API
const {
  getCustomerDetails
} = require('../../../inter_service_api/dms_dashboard_v1/v1');

// self apis
const {
  hitTallyCustomerAccountsSync,
  hitCustomerPaymentInvoiceSync,
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
class pickerboySalesOrderMappingController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.salesOrder;
  }

  // do something 
  getUserDetails = async (req, res) => {
    try {
      info('Get Picker Boy Details !');
      let date = new Date();
      let endOfTheDay = moment(date).set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0
      }).toDate();
      let startOfTheDay = moment(date).set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      // inserting the new user into the db
      let pickerBoyDetails = await PickerBoyCtrl.getPickerBoyFullDetails(req.user._id);

      // is inserted 
      if (pickerBoyDetails.success && !_.isEmpty(pickerBoyDetails.data)) {
        // fetch the attendance 
        let attendanceDetails = await AttendanceCtrl.getAttendanceDetailsForADay(req.user._id, startOfTheDay, endOfTheDay)
          .then((data) => {
            if (data.success) {
              let totalWorkingInMins = 0;
              // get the total working in mins 
              if (data.data.attendanceLog && data.data.attendanceLog.length)
                totalWorkingInMins = _.sumBy(data.data.attendanceLog, 'totalWorkingInMins')
              return {
                isFirstCheckedIn: data.data.attendanceLog ? data.data.attendanceLog.length ? 1 : 0 : 0,
                attendanceLog: data.data.attendanceLog ? data.data.attendanceLog.length ? data.data.attendanceLog[data.data.attendanceLog.length - 1] : [] : [],
                totalWorkingInMinsTillLastCheckOut: totalWorkingInMins
              }
            } else return {
              isFirstCheckedIn: 0,
              attendanceLog: {},
              totalWorkingInMinsTillLastCheckOut: 0
            };
          });

        // success response 
        return this.success(req, res, this.status.HTTP_OK, {
          ...pickerBoyDetails.data,
          attendanceDetails: attendanceDetails
        }, this.messageTypes.userDetailsFetchedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.userNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // do something 
  updatetUserDetails = async (req, res) => {
    try {
      info('Picker Boy  Profile PATCH REQUEST !');
      let id = req.user._id || '';

      // inserting data into the db 
      let isUpdated = await PickerBoyCtrl.updateDetails(req.body.toChangeObject, id);

      // check if updated 
      if (isUpdated.success) return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.pickerBoyDetailsUpdated);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.pickerBoyDetailsNotUpdated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

// get Invoice

getInvoiceDocumentDetail = async (req,res)=>{
      // get the sale Order Details
      try{
      let id = req.params.invId
      console.log('id',id)
      let dataObj  = await invMasterCtrl.getDetails(id);
      let saleOrderDetails = {'type':req.params.type};

      // check if inserted 
      if (dataObj && !_.isEmpty(dataObj)) return this.success(req, res, this.status.HTTP_OK, dataObj, this.messageTypes.salesOrderDetailsFetched);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  



  // get customer details 
  getCustomerDetails = async (req, res) => {
    try {
      info('Get the Customer List !');

      // getting the data from request 
      let customerId = req.params.customerId;
      let cityId = req.params.cityId;

      let customerDataFromMicroService = await getCustomerDetails(customerId, cityId);
      if (customerDataFromMicroService.success) {
        // success
        return this.success(req, res, this.status.HTTP_OK, customerDataFromMicroService.data, this.messageTypes.customerDetailsFetchedSuccessfully);
      }
      else {
        error('Unable to fetch Customer Details!');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedCustomerDetails);
      }

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
  // internal function to get the basket items details
  viewOrderBasketInternal = async (pickerBoySalesOrderMappingId) => {
    try {
      info('Internal funct to View the Order Basket !');

      // get the basket data
      let salesOrderData = await Model.aggregate([{
        $match: {
          '_id': mongoose.Types.ObjectId(pickerBoySalesOrderMappingId)
        }
      },
      {
        $lookup: {
          from: 'pickerboysalesorderitemsmappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                '$expr': {
                  '$eq': ['$pickerBoySalesOrderMappingId', '$$id']
                }
              }
            }, {
              $project: {
                'itemName': 1,
                'itemId': 1,
                'quantity': 1,
                'suppliedQty': 1,
                'salePrice': 1,
                'taxPercentage': 1,
                'discountPercentage': 1,

              }
            }
          ],
          as: 'availableItemDetails'
        }
      },
      {
        $lookup: {
          from: 'salesorders',
          let: {
            'id': '$salesOrderId'
          },
          pipeline: [
            {
              $match: {
                // 'status': 1,
                // 'isDeleted': 0,
                '$expr': {
                  '$eq': ['$_id', '$$id']
                }
              }
            }, {
              $project: {
                'status': 1,
                'onlineChildReferenceNo': 1,
                'onlineReferenceNo': 1,
                'orderItems': 1,
                'otherChargesTaxInclusive': 1,
                'customerType': 1,
                'req_del_date': 1,
                'customerId': 1,
                'sales_order_no':1,
                'ship_to_party':1,
                'sold_to_party':1,
                'plant':1,
                'item':1
              }
            }
          ],
          as: 'salesOrdersDetails'
        }
      },
      {
        $unwind: {
          path: '$salesOrdersDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          'salesOrdersDetails.status': 1,
          'salesOrdersDetails.onlineChildReferenceNo': 1,
          'salesOrdersDetails.onlineReferenceNo': 1,
          'salesOrdersDetails.orderItems': 1,
          'salesOrdersDetails.otherChargesTaxInclusive': 1,
          'salesOrdersDetails.customerType': 1,
          'salesOrdersDetails.req_del_date': 1,
          'salesOrdersDetails.item_no': 1,
          'salesOrdersDetails.customerId': 1,
          'pickerBoyId': 1,
          'customerType': 1,
          'salesOrderId': 1,
          'availableItemDetails': 1
        }
      }
      ])

      // check if inserted 
      if (salesOrderData && !_.isEmpty(salesOrderData)) {
        return {
          success: true,
          data: salesOrderData
        }
      } else {
        error('Error Searching Data in SO DB!');
        return {
          success: false,
        }
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }



// pending logic clarification required

  // get to do sales order details
  getToDoSalesOrder = async (req, res) => {
    try {
      info('Getting  Sales Order  Data !!!');
      let page = req.query.page || 1,
        assignedSalesOrderId = [],
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt';
      let skip = parseInt(page - 1) * pageSize;
      let locationId = req.user.locationId || 0; // locationId 
      let cityId = req.user.cityId || 'N/A'; // cityId 

      let startOfTheDay = moment().set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      // getting the end of the day 
      let endOfTheDay = moment().set({
        h: 24,
        m: 24,
        s: 0,
        millisecond: 0
      }).toDate();

      //finding the total sales order records, which are already assigned to the pickerboy


      let assignedSalesOrderData = await Model.find({
        'createdAt': {
          '$gte': startOfTheDay,
          '$lte': endOfTheDay
        }
      }, { 'salesOrderId': 1 }).lean()


      if (assignedSalesOrderData && !_.isEmpty(assignedSalesOrderData)) {
        assignedSalesOrderId = assignedSalesOrderData.map(data => data.salesOrderId)
      }

      //creating the object with query details to pass , in order to get the sales order details
      let salesQueryDetails = {
        page,
        pageSize,
        searchKey,
        sortBy,
        locationId,
        cityId,
        startOfTheDay,
        endOfTheDay,
        assignedSalesOrderId
      }



      // finding the  data from the db 
      let salesOrderData = await SalesOrderCtrl.getSalesOrderDetails(salesQueryDetails);
      // success
      if (salesOrderData.success) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: salesOrderData.data,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: salesOrderData.total
          }
        }, this.messageTypes.toDoSalesOrderDetailsFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchToDoSalesOrderDetails);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
// pending for spot transfer asset transfer

getOrderDetails = async (req,res,next)=>{
    let Model;
    info('Getting the Order History!!!');
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        orderId = req.params.orderId,
        searchKey =  '', //req.query.search ||
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId =  'N/A', // cityId req.user.cityId ||
        searchDate = req.body.searchDate || '',
         orderData = {}
    try {
      info('SalesOrder GET DETAILS !');
      console.log(req.params.type)
      switch(req.params.type){
        case 'salesorders':
          Model= salesOrderInvMappingModel;
          orderData = await salesOrderInvMappingModel.findOne({'salesOrderId':mongoose.Types.ObjectId(orderId)}).populate('salesOrderId').lean().then((res) => {
          
            if (res && !_.isEmpty(res)) {
              return {
                success: true,
                data: res
              }
            } else {
              error('Error Searching Data in saleOrder DB!');
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
      // get the sale Order Details
      let saleOrderDetails = {'type':req.params.type};
      
    
      // check if inserted 
      if (orderData && !_.isEmpty(orderData)) return this.success(req, res, this.status.HTTP_OK, orderData, this.messageTypes.salesOrderDetailsFetched);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }



  // get details 
  getSalesOrder = async (req, res) => {
    let Model;
    info('Getting the Order Detail!!!');
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        orderId = req.params.orderId,
        searchKey =  '', //req.query.search ||
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId =  'N/A', // cityId req.user.cityId ||
        searchDate = req.body.searchDate || '',
         orderData = {}
    try {
      info('SalesOrder GET DETAILS !');
      console.log(req.params.type)
      switch(req.params.type){
        case 'salesorders':
         
          orderData= await salesOrderModel.find({'_id':mongoose.Types.ObjectId(orderId)}).lean().then((res) => {
          
            if (res && !_.isEmpty(res)) {
              return {
                success: true,
                data: res
              }
            } else {
              error('Error Searching Data in saleOrder DB!');
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
          
          break;
        case 'spotsales':
          Model= spotSalesModel;
          
          break;
        case 'assettransfer':
          Model= require('../../MyTrip/assign_trip/model/spotsales.model')
          break;
        default:
          Model=null
          break;
  
      }
      // get the sale Order Details
   

      // check if inserted 
      if (orderData && !_.isEmpty(orderData)) return this.success(req, res, this.status.HTTP_OK, orderData, this.messageTypes.salesOrderDetailsFetched);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  //changing the state of picker sales order mapping 
  changeStateToInvoiceGenerated = async (pickerBoySalesOrderMappingId) => {
    try {
      info(' STATE CHANGE TO INVOICE GENERATED!');

      // creating data to insert
      let dataToUpdate = {
        $set: {
          state: 2
        }
      };

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      }).then((data) => {
        if (!_.isEmpty(data)) {
          return {
            success: true,
            data: data
          }
        } else return {
          success: false
        }
      }).catch((err) => {
        return {
          success: false,
          error: err
        };
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      };
    }
  }

  // get details 
  pickingState = async (req, res) => {
    try {
      info('Add SalesOrder in Picking state a !');

      // get the sale Order Details
      let saleOrderDetails = req.body.saleOrderDetails;

      let dataToInsert = {
        'delivery_type':'N/A',
        'shipping_point':saleOrderDetails.plant,
        'delivery_no':'N/A',
        'picking_date':moment(new Date()).format('YYYY-MM-DD'),
        'delivery_date':saleOrderDetails.req_del_date||moment(new Date()).format('YYYY-MM-DD'),
        'picking_time':moment(new Date()).format('hh:mm:ss'),
        'sales_order_no':saleOrderDetails.sales_order_no,
        'salesOrderId': saleOrderDetails._id,
        'pickerBoyId': req.user._id,
        // 'pickerBoyId': mongoose.Types.ObjectId('60227a45c9e10d6cda8c182b'),
        'createdBy': req.user.email,
        'pickingDate': new Date()
      };

      // inserting data into the db 
      let isInserted = await Model.startPickingOrder(dataToInsert);

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.salesOrderAddedInPackingStage);
      } else {
        error('Error while adding in packing collection !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderNotAddedInPackingStage);
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // get details while scanning state
  scanState = async (req, res) => {
    try {
      info('Get SalesOrder details after Picking state !');
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt';
      let sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;
      
      // get the sale Order Details
      let salesOrderData = await Model.aggregate([{
        $match: {
          '_id': mongoose.Types.ObjectId(req.params.pickerBoySalesOrderMappingId)
        }
      },
      {
        $lookup: {
          from: 'salesorders',
          let: {
            'id': '$salesOrderId'
          },
          pipeline: [
            {
              $match: {
                // 'status': 1,
                // 'isDeleted': 0,
                '$expr': {
                  '$eq': ['$_id', '$$id']
                }
              }
            }, {
              $project: {
                'invoiceNo': 1,
                'onlineReferenceNo': 1,
                'onlineChildReferenceNo': 1,
                'customerId': 1,
                'customerName': 1,
                'customerCode': 1,
                'customerType': 1,
                'orderItems': 1,
                'deliveryDate': 1,
              
              }
            }
          ],
          as: 'salesOrdersDetails'
        }
      },
      {
        $unwind: {
          path: '$salesOrdersDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          'pickerBoyId': 1,
          'customerType': 1,
          'salesOrderId': 1,
          'isItemPicked':1,
          'updatedAt':1,
          'isStartedPicking':1,
          'salesOrdersDetails.deliveryDate': 1,
          'salesOrdersDetails.invoiceNo': 1,
          'salesOrdersDetails.onlineReferenceNo': 1,
          'salesOrdersDetails.onlineChildReferenceNo': 1,
          'salesOrdersDetails.customerId': 1,
          'salesOrdersDetails.customerCode': 1,
          'salesOrdersDetails.customerName': 1,
          'salesOrdersDetails.customerType': 1,
          'salesOrdersDetails.orderItems': 1,
          'salesOrdersDetails.orderItems': 1,
        }
      }
      ])

      // check if inserted 
      if (salesOrderData && !_.isEmpty(salesOrderData)) {
        return this.success(req, res, this.status.HTTP_OK,{
          results: salesOrderData,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: salesOrderData[0].salesOrdersDetails.orderItems.length
          }
        }, this.messageTypes.salesOrderDetailsFetched);
      } else {
        error('Error while getting the sales Order data after picking state !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderDetailsNotFetched);
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get details while scanning state
  viewOrderBasket = async (req, res) => {
    try {
      info('View the Order Basket !');

      // initializing the value
      let totalQuantityDemanded = 0, 
        totalQuantitySupplied = 0,
        totalAmount = 0,
        totalCgstTax = 0,
        totalSgstTax = 0,
        totalDiscount = 0,
        totalNetValue = 0;


        let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 10; })
       
      let skip = parseInt(page - 1) * pageSize;
     

      // get the basket data
      let salesOrderData = await Model.aggregate([{
        $match: {
          '_id': mongoose.Types.ObjectId(req.params.pickerBoySalesOrderMappingId)
        }
      },
      {
        $lookup: {
          from: 'pickerboysalesorderitemsmappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                '$expr': {
                  '$eq': ['$pickerBoySalesOrderMappingId', '$$id']
                }
              }
            }, {
              $project: {

                'itemDetail': 1,
                // 'itemDetail.itemId': 1,
                // 'itemDetail.quantity': 1,
                // 'itemDetail.suppliedQty': 1,
                // 'itemDetail.salePrice': 1,
                // 'itemDetail.taxPercentage': 1,
                // 'itemDetail.discountPercentage': 1,
              }
            }
          ],
          as: 'availableItemDetails'
        }
      },
      {
        $lookup: {
          from: 'salesorders',
          let: {
            'id': '$salesOrderId'
          },
          pipeline: [
            {
              $match: {
                // 'status': 1,
                // 'isDeleted': 0,
                '$expr': {
                  '$eq': ['$_id', '$$id']
                }
              }
            }, {
              $project: {
                'status': 1,
                'onlineChildReferenceNo': 1,
                'onlineReferenceNo': 1,
                'orderItems': 1,
                'otherChargesTaxInclusive': 1,
                'customerType': 1,
                'deliveryDate': 1,
                'customerId': 1,
              }
            }
          ],
          as: 'salesOrdersDetails'
        }
      },
      {
        $unwind: {
          path: '$salesOrdersDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          'salesOrdersDetails.status': 1,
          'salesOrdersDetails.onlineChildReferenceNo': 1,
          'salesOrdersDetails.onlineReferenceNo': 1,
          'salesOrdersDetails.orderItems': 1,
          'salesOrdersDetails.otherChargesTaxInclusive': 1,
          'salesOrdersDetails.customerType': 1,
          'salesOrdersDetails.deliveryDate': 1,
          'salesOrdersDetails.customerId': 1,
          'pickerBoyId': 1,
          'customerType': 1,
          'salesOrderId': 1,
          'availableItemDetails': 1
        }
      }
      ])
console.log(salesOrderData)
      // check if inserted 
      if (salesOrderData && !_.isEmpty(salesOrderData)) {
        //calculating the total basket amount -- needs to moved into hook
        //calculating the total quantity supplied and demanded

        await salesOrderData[0].availableItemDetails[0].itemDetail.map((v, i) => {
      
          totalQuantitySupplied = v.pickedQuantity + totalQuantitySupplied
          totalQuantityDemanded = v.requireQuantity + totalQuantityDemanded
        });

        //calculating the discount and tax
        for (let item of salesOrderData[0].availableItemDetails[0].itemDetail) {
          //calculating discount

          let discountForSingleItem = parseFloat((item.discountPercentage / 100 * item.mrp_amount).toFixed(2))
          let discountForSupliedItem = discountForSingleItem * item.pickedQuantity
          totalDiscount = totalDiscount + discountForSupliedItem;

          //calculating selling price after discount

          let amountAfterDiscountForSingle = item.total_amount - discountForSingleItem;
          // let amountAfterDiscountForSuppliedItem = amountAfterDiscountForSingle * item.pickedQuantity
          totalAmount = totalAmount + item.total_amount;

          // calculating the tax amount 

          let taxValueForSingleItemCGST = parseFloat((amountAfterDiscountForSingle * item['cgst-pr'] / 100).toFixed(2))
          let amountAfterCgstTaxForSingle = amountAfterDiscountForSingle + taxValueForSingleItemCGST;
          let CgstTaxValueForSuppliedItem = taxValueForSingleItemCGST * item.suppliedQty
          totalCgstTax = totalCgstTax + CgstTaxValueForSuppliedItem;

          // calculating the tax amount for SGST
          let taxValueForSingleItemSGST = parseFloat((amountAfterDiscountForSingle * item['sgst_pr'] / 100).toFixed(2))
          let amountAfterSgstTaxForSingle = amountAfterDiscountForSingle + taxValueForSingleItemSGST;
          let SgstTaxValueForSuppliedItem = taxValueForSingleItemSGST * item.suppliedQty
          totalSgstTax = totalSgstTax + SgstTaxValueForSuppliedItem;

          // calculating net amount 
          let netValueForSingleItem = amountAfterDiscountForSingle - taxValueForSingleItemCGST - taxValueForSingleItemSGST;
          let netValueForSuppliedItem = netValueForSingleItem * item.suppliedQty
          totalNetValue = totalNetValue + netValueForSuppliedItem;

          //adding all the values in item object
          item.discountForSingleItem = discountForSingleItem;
          item.amountAfterDiscountForSingle = amountAfterDiscountForSingle;
          item.amountAfterCgstTaxForSingle = amountAfterCgstTaxForSingle;
          item.amountAfterSgstTaxForSingle = amountAfterSgstTaxForSingle;

          item.netValueForSingleItem = netValueForSuppliedItem;

        }

        salesOrderData[0].totalQuantitySupplied = totalQuantitySupplied
        salesOrderData[0].totalQuantityDemanded = totalQuantityDemanded
        salesOrderData[0].totalAmount = totalAmount
        salesOrderData[0].totalCgstTax = totalCgstTax
        salesOrderData[0].totalSgstTax = totalSgstTax
        salesOrderData[0].totalDiscount = totalDiscount
        salesOrderData[0].totalNetValue = totalNetValue
        return this.success(req, res, this.status.HTTP_OK,  {
          results: salesOrderData,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: salesOrderData[0].availableItemDetails[0].itemDetail.length
          }
        }, this.messageTypes.salesOrderDetailsFetched);
      } else {
        error('Error while getting the sales Order data after picking state !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderDetailsNotFetched);
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // ongoing SO/invoice status
  onGoingOrders = async (req, res) => {
    try {
      info('View the Ongoing Orders !');
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt';
      let sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;
      let searchDate = req.body.searchDate || ''

      let startOfTheDay = moment().set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      // getting the end of the day 
      let endOfTheDay = moment().set({
        h: 24,
        m: 24,
        s: 0,
        millisecond: 0
      }).toDate();

      if (searchDate && !_.isEmpty(searchDate)) {

        startOfTheDay = moment(searchDate, 'DD-MM-YYYY').set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate();

        // getting the end of the day 
        endOfTheDay = moment(searchDate, 'DD-MM-YYYY').set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0
        }).toDate();
      }


      let searchObject = {

        'pickingDate': {
          '$gte': startOfTheDay,
          '$lte': endOfTheDay
        }
      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'createdBy': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'pickerBoyId': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };
      console.log('searchObject', searchObject);

      let totalCount = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      },
      {
        $count: 'sum'
      }
      ]).allowDiskUse(true);

      // calculating the total number of applications for the given scenario
      if (totalCount[0] !== undefined)
        totalCount = totalCount[0].sum;
      else
        totalCount = 0;

      // get list  
      let salesOrderList = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      }, {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
      },
      {
        $project: {
          'salesOrderId': 1,
          'pickerBoyId': 1,
          'InvoiceId': 1,
          'state': 1,
        }
      }, {
        $lookup: {
          from: 'salesorders',
          let: {
            'id': '$salesOrderId'
          },
          pipeline: [
            {
              $match: {
                '$expr': {
                  '$eq': ['$_id', '$$id']
                }
              }
            }, {
              $project: {
                'status': 1,
                'onlineChildReferenceNo': 1,
                'onlineReferenceNo': 1,
                // 'orderItems': 1,
                'otherChargesTaxInclusive': 1,
                'customerType': 1,
                'salesOrderId': 1,
                'numberOfItems': { $cond: { if: { $isArray: "$orderItems" }, then: { $size: "$orderItems" }, else: "NA" } }

              }
            }
          ],
          as: 'salesOrdersDetails'
        }
      },

      ]).allowDiskUse(true)
      // success
      if (true) {
        return this.success(req, res, this.status.HTTP_OK, {
          salesOrderList
          // results: salesOrderData.data,
          // pageMeta: {
          //   skip: parseInt(skip),
          //   pageSize: pageSize,
          //   total: salesOrderData.total
          // }
        }, this.messageTypes.toDoSalesOrderDetailsFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchToDoSalesOrderDetails);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // Internal Function get pickerboy sales order mapping details
  getDetails = (pickerBoySalesOrderMappingId) => {
    try {
      info('Get PickerBoy SalesOrder Mapping Details !');

      // get details 
      return Model.findOne({
        _id: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId),
        isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in PickerBoy SalesOrder Mapping DB!');
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
      return {
        success: false,
        error: err
      }
    }
  }

  // Internal Function get  sales order  details
  getSalesOrderDetails = (saleOrderId) => {
    try {
      info('Get SalesOrder  Details !');

      // get details 
      return Model.findOne({
        salesOrderId: mongoose.Types.ObjectId(saleOrderId),
        isDeleted: 0,
        isItemPicked:true
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching sales order in PickerBoy SalesOrder Mapping DB!');
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
      return {
        success: false,
        error: err
      }
    }
  }

  // get pending salesorder details
  getPendingSalesOrder = async (req, res) => {
    try {
      info('Getting  the Pending Sales Order  Data !');
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = req.user.locationId || 0, // locationId 
        cityId = req.user.cityId || 'N/A', // cityId 
        searchDate = req.body.searchDate || '';

      let startOfTheDay = moment().set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      // getting the end of the day 
      let endOfTheDay = moment().set({
        h: 24,
        m: 24,
        s: 0,
        millisecond: 0
      }).toDate();

      if (searchDate && !_.isEmpty(searchDate)) {
        console.log('he');

        startOfTheDay = moment(searchDate, 'DD-MM-YYYY').set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate();

        // getting the end of the day 
        endOfTheDay = moment(searchDate, 'DD-MM-YYYY').set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0
        }).toDate();
      }

      //creating the object with query details to pass , in order to get the sales order details
      let salesQueryDetails = {
        page,
        pageSize,
        searchKey,
        sortBy,
        locationId,
        cityId,
        startOfTheDay,
        endOfTheDay
      }
      // console.log('salesQueryDetails', salesQueryDetails);

      // finding the  data from the db 
      let salesOrderData = await SalesOrderCtrl.getPartialSalesOrder(salesQueryDetails);
      // success
      if (salesOrderData.success) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: salesOrderData.data,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: salesOrderData.total
          }
        }, this.messageTypes.pendingSalesOrderFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedPendingSalesOrder);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }



  // get history salesorder details
  getHistoryOfSalesOrder = async (req, res) => {
    try {
      info('Getting the Order History!!!');
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey =  '', //req.query.search ||
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId =  'N/A', // cityId req.user.cityId ||
        searchDate = req.body.searchDate || '';

      let startOfTheDay = moment().set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      let endOfTheDay = moment().set({
        h: 24,
        m: 24,
        s: 0,
        millisecond: 0
      }).toDate();
  

      if (searchDate && !_.isEmpty(searchDate)) {
        console.log('he');

        startOfTheDay = moment(searchDate, 'DD-MM-YYYY').set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate();

        // getting the end of the day 
        endOfTheDay = moment(searchDate, 'DD-MM-YYYY').set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0
        }).toDate();
      }

      //creating the object with query details to pass , in order to get the sales order details
      let salesQueryDetails = {
        page,
        pageSize,
        searchKey,
        sortBy,
        locationId,
        cityId,
        startOfTheDay,
        endOfTheDay
      }

      console.log('salesQueryDetails', salesQueryDetails);

      // finding the  data from the db 
      
      let hisoryData = await SalesOrderCtrl.getHistorySalesOrder(salesQueryDetails);
      console.log(hisoryData)
      // success 
      if (hisoryData.success) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: hisoryData.data,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: hisoryData.total
          }
        }, this.messageTypes.pendingSalesOrderFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedPendingSalesOrder);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // getOrderHistoryByPickerBoyID
  getOrderHistoryByPickerBoyID = async (req,res,next) => {
    try {
      info('Get History  Order details !');
      
      // let { sortBy, page, pageSize, locationId, cityId, searchKey, startOfTheDay, endOfTheDay } = req.query
      // let sortingArray = {};
      // sortingArray[sortBy] = -1;
      // let skip = parseInt(page - 1) * pageSize;
         // get the query params
         let page = req.query.page || 1,
         pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
         searchKey = req.query.search || '',
         sortBy = req.query.sortBy || 'req_del_date',
         sortingArray = {};
         sortingArray[sortBy] = -1;
       let skip = parseInt(page - 1) * pageSize;

// item count missing
      let searchObject = {
        'pickerBoyId':mongoose.Types.ObjectId(req.user._id), //req.user._id,
        'invoiceDetail.isInvoice':true
        // 'isPacked': 0,
        // 'fulfillmentStatus': 0,
        // 'locationId': parseInt(locationId),
        // 'cityId': cityId,

        // 'req_del_date': {
        
        //   '$lte': startOfTheDay
        // }
      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'customerName': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'customerCode': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };
        console.log(...searchObject)
      let totalCount = await Model.aggregate([{
        $match: 
          searchObject
        
      },
      {
        $count: 'sum'
      }
      ]).allowDiskUse(true);

      // calculating the total number of applications for the given scenario
      if (totalCount[0] !== undefined)
        totalCount = totalCount[0].sum;
      else
        totalCount = 0;

      // get list  
      let salesOrderList = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      }, {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
      },
      {
        $project: {
          'onlineReferenceNo': 1,
          'customerCode': 1,
          'customerName': 1,
          'customerType': 1,
          'shippingId':1,
          'cityId':1,
          'plant':1,
          'sales_order_no':1,
          'status':1,
          'invoiceNo': 1,
          'req_del_date':1,
          'salesOrderId':1,
          'fulfillmentStatus': 1,
          'numberOfItems': { $cond: { if: { $isArray: "$orderItems" }, then: { $size: "$orderItems" }, else: "NA" } }
        }
      }
      ]).allowDiskUse(true)
      console.log(salesOrderList)
      // return {
      //   success: true,
      //   data: salesOrderList,
      //   total: totalCount
      // };
      if (salesOrderList.length>0) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: salesOrderList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: salesOrderList.length  //item
          }
        }, this.messageTypes.todoOrderFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedPendingSalesOrder);
    

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
      }
    }
  }
  // get the last picker time from pickerboy
  getLastPickingTimeUsingPickerBoyId = async (userId, date) => {
    try {
      info('Get The last picking time  using the pickerboy id !');

      // get the end of the day
      let endOfTheDay = moment(date).set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0
      }).toDate();

      // get the start of the day
      let startOfTheDay = moment(date).set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      // updating the model with the latest invoices
      return Model.aggregate([{
        '$match': {

          'pickerBoyId': mongoose.Types.ObjectId(userId),
          'pickingDate': {
            $gte: startOfTheDay,
            $lte: endOfTheDay
          }
        }
      }, {
        '$sort': {
          'createdAt': -1
        }
      }, {
        '$limit': 1
      }, {
        '$project': {
          'pickerBoyId': 1,
          'pickingDate': {
            '$dateToString': {
              format: "%Y-%m-%d",
              date: "$pickingDate",
              timezone: "+05:30"
            }
          },
          'pickingDateHour': {
            '$dateToString': {
              format: "%H",
              date: "$pickingDate",
              timezone: "+05:30"
            }
          },
          'pickingDateMin': {
            '$dateToString': {
              format: "%M",
              date: "$pickingDate",
              timezone: "+05:30"
            }
          },
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length) {
            // success 
            return {
              success: true,
              data: res[res.length - 1]
            }
          } else {
            return {
              success: false
            }
          }
        });


      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }



  getTodaysOrder = async(req,res,next)=>{
    let orderModel
try{
  console.log(req.user.plant)
    info('Getting the todays Order !!!');
    let page = req.query.page || 1,
      pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
      searchKey =  '', //req.query.search ||
      sortBy = req.query.sortBy || 'createdAt',
      skip = parseInt(page - 1) * pageSize,
      locationId = 0, // locationId req.user.locationId || 
      cityId =  'N/A', // cityId req.user.cityId ||
      searchDate = req.body.searchDate || '',
      type = req.params.type,
      plant = req.user.plant;
      // 2021-03-29
    let startOfTheDay =  moment(new Date()).format('YYYY-MM-DD');
    // moment().set({
    //   h: 0,
    //   m: 0,
    //   s: 0,
    //   millisecond: 0
    // }).toDate();

    let endOfTheDay = moment(new Date()).format('YYYY-MM-DD');
    //  moment().set({
    //   h: 24,
    //   m: 24,
    //   s: 0,
    //   millisecond: 0
    // }).toDate();

    
    if (searchDate && !_.isEmpty(searchDate)) {
      

      startOfTheDay = moment(searchDate).format('YYYY-MM-DD')

      // getting the end of the day 
      endOfTheDay = moment(searchDate).format('YYYY-MM-DD')
    }
console.log(startOfTheDay)

    let pipeline = [{
      $match:{
      'req_del_date': {
        '$eq': startOfTheDay
      },
      'plant':{'$eq':plant.toString()}
    }
    }];

    // creating a match object
    if (searchKey !== '')
    pipeline = [{
      $match:{
        'req_del_date': {
      '$eq': startOfTheDay
       
        }
      ,
        '$or': [{
          'createdBy': {
            $regex: searchKey,
            $options: 'is'
          }
        }, {
          'pickerBoyId': {
            $regex: searchKey,
            $options: 'is'
          }
        }]
      }
      
      }];
    console.log('searchObject', pipeline);



    // get list



 

    switch(type){

    case 'salesorders':
      pipeline.push(
        {
          $lookup: {
              from: 'pickerboyordermappings',
              let: {
                'orderId': '$_id'
              },
              pipeline: [
                

                {
                  $match: {
                    'invoiceDetail.isInvoice':false,
                    'status': 1,
                    'isDeleted': 0,
                    '$expr': {
                      '$eq': ['$salesOrderId', '$$orderId']
                    }
                  }
                }],
                as:'pickingStatus'
          }   
        }
      )
      orderModel = salesOrderModel;
      break;  
    case 'spotsales':
      orderModel = spotSalesModel;
      
      break;
    case 'assettransfer':
      pipeline.push(
        {
          $lookup: {
              from: 'pickerboyordermappings',
              let: {
                'orderId': '$_id'
              },
              pipeline: [
                

                {
                  $match: {
                    'invoiceDetail.isInvoice':false,
                    'status': 1,
                    'isDeleted': 0,
                    '$expr': {
                      '$eq': ['$assetTransferId', '$$orderId']
                    }
                  }
                }],
                as:'pickingStatus'
          }   
        }
      )
      orderModel = require('../../MyTrip/assign_trip/model/assetTransfer.model')
      break;
    default:
      orderModel = salesOrderModel
      break;

  }


  let todaysOrderData = await orderModel.aggregate(pipeline)
  // let todaysOrderData = await orderModel.find({'req_del_date':'2021-03-29'})

  console.log(todaysOrderData);



  if (todaysOrderData.length>0) {
    return this.success(req, res, this.status.HTTP_OK, {
      results: todaysOrderData,
      pageMeta: {
        skip: parseInt(skip),
        pageSize: pageSize,
        total: todaysOrderData[0]['item'].length  //item
      }
    }, this.messageTypes.todoOrderFetchedSuccessfully);
  }
  else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedPendingSalesOrder);

  // catch any runtime error 
} catch (err) {
  error(err);
  this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
}
  }

   updateItemPickStatus = async (id,status)=>{

    return await Model.updateIsItemPickedStatus(id,status);



  }

  getOrderItem = async (pickerboySalesOrderMappingId,item_no)=>{
  return Model.aggregate([
    {'$match':{'_id':mongoose.Types.ObjectId(pickerboySalesOrderMappingId)}},
    {'$lookup':{
      'from':'salesorders',
      'let':{'so_id':'$salesOrderId'},
    'pipeline': [
      // {'$unwind': { path: '$item'} },
        { '$match': {
          
          '$expr': { '$and': [ 
            {$eq:['$_id','$$so_id']},
          // {$eq:[ '$item.item_no',item_no]}
         ] 
        }
        }}
        
        
      ],
    as:"salesOrders"
}}
]).allowDiskUse(true).then((res) => {
  let plant = res[0]['salesOrders'][0]['plant'];
  // console.log(res[0])
  let item = res[0]['salesOrders'][0]['item'].filter(item => item['item_no'] ===item_no);
  // console.log('item',_.isEmpty(item))
  if (item && !_.isEmpty(item)) {
    return {
      success: true,
      data: {'salesOrder':item[0],'plant':res[0]['salesOrders'][0]['plant']}
  
  
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
 


}
// fix require

  
  getOrderDetail = async (pickerBoyOrderMappingId)=>{
    return Model.getOrderByPickerBoyId (pickerBoyOrderMappingId);
  }

  getOrderDetailByPickerBoyId = async (pickerBoyId)=>{
    return await Model.findOne({$and:[{'pickerBoyId':mongoose.Types.ObjectId(pickerBoyId)},{'isStartedPicking':true},{'isItemPicked':true},{'invoiceDetail.isInvoice':false}]}).lean().then((res) => {
          
      if (res && !_.isEmpty(res)) {
        return {
          success: true,
          data: res
        }
      } else {
        error('Error Searching Data in saleOrder DB!');
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
    
  }


  updateFullFilmentStatus = (pickerBoyOrderMappingId,status)=>{
    return Model.updateFullFilmentStatus (pickerBoyOrderMappingId,status);
  }


  

}



// exporting the modules 
module.exports = new pickerboySalesOrderMappingController();