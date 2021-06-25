// controllers 
const SalesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
const PickerBoyCtrl = require('../../employee/picker_boy/picker_boy.controller');
const AttendanceCtrl = require('../onBoard/app_picker_user_attendance/app_picker_user_attendance.controller');
const salesOrderModel = require('../../sales_order/sales_order/models/sales_order.model')
const salesOrderInvMappingModel = require('../../MyTrip/assign_trip/model/salesOrder.model');
const salesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
const spotSalesModel = require('../../MyTrip/assign_trip/model/spotsales.model');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const invMasterCtrl = require('../invoice_master/invoice_master.controller');
const BaseController = require('../../baseController');
const Model = require('./models/pickerboy_salesorder_mapping.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
var { Parser } = require('json2csv')
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
const invoice = require('../../../responses/types/invoice');
const { db } = require('../../sales_order/sales_order/models/sales_order.model');

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
      let isUpdated = await PickerBoyCtrl.updateDetails(req.body, id);

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

  getInvoiceDocumentDetail = async (req, res) => {
    // get the sale Order Details
    try {
      let id = req.params.invId
      console.log('id', id)
      let dataObj = await invMasterCtrl.getDetails(id);
      let saleOrderDetails = { 'type': req.params.type };

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

      let customerDataFromMicroService = await getCustomerDetails(customerId);
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
                'sales_order_no': 1,
                'ship_to_party': 1,
                'sold_to_party': 1,
                'plant': 1,
                'item': 1
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

  getOrderDetails = async (req, res, next) => {
    let Model;
    info('Getting the Order History!!!');
    let page = req.query.page || 1,
      pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
      orderId = req.params.orderId,
      searchKey = '', //req.query.search ||
      sortBy = req.query.sortBy || 'createdAt',
      skip = parseInt(page - 1) * pageSize,
      locationId = 0, // locationId req.user.locationId || 
      cityId = 'N/A', // cityId req.user.cityId ||
      searchDate = req.body.searchDate || '',
      orderData = {}
    try {
      info('SalesOrder GET DETAILS !');
      console.log(req.params.type)
      switch (req.params.type) {
        case 'salesorders':
          Model = salesOrderInvMappingModel;
          orderData = await salesOrderInvMappingModel.findOne({ 'salesOrderId': mongoose.Types.ObjectId(orderId) }).populate('salesOrderId').lean().then((res) => {

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
          Model = spotSalesModel;

          break;
        case 'assettransfer':
          mMdel = require('../../MyTrip/assign_trip/model/spotsales.model')
          break;
        default:
          Model = null
          break;

      }
      // get the sale Order Details
      let saleOrderDetails = { 'type': req.params.type };


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
      searchKey = '', //req.query.search ||
      sortBy = req.query.sortBy || 'createdAt',
      skip = parseInt(page - 1) * pageSize,
      locationId = 0, // locationId req.user.locationId || 
      cityId = 'N/A', // cityId req.user.cityId ||
      searchDate = req.body.searchDate || '',
      orderData = {}
    try {
      info('SalesOrder GET DETAILS !');
      // console.log(orderId)
      switch (req.params.type) {
        case 'salesorders':
          //check for release
          orderData = await salesOrderModel.find({ '_id': mongoose.Types.ObjectId(orderId) }).lean().then((res) => {

            if (res && !_.isEmpty(res)) {
              // console.log('Get details',res)
              return {
                success: true,
                data: res
              }
            } else {
              // console.log('no data')
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
          Model = spotSalesModel;

          break;
        case 'assettransfer':
          Model = require('../../MyTrip/assign_trip/model/spotsales.model')
          break;
        default:
          Model = null
          break;

      }
      // get the sale Order Details
      console.log(orderData)
      // orderData.forEach((items,i)=>{

      // })




      // check if inserted 
      if (orderData && !_.isEmpty(orderData)) {
        orderData['data'][0]['item'].forEach((item, j) => {
          console.log(parseInt(item.qty), parseInt(item.suppliedQty ? item.suppliedQty : 0), (parseInt(item.qty) - parseInt(item.suppliedQty ? item.suppliedQty : 0)))
          orderData['data'][0]['item'][j]['qty'] = (parseInt(item.qty) - parseInt(item.suppliedQty ? item.suppliedQty : 0)).toString()
          if ((item.fulfillmentStatus ? item.fulfillmentStatus : 0) == 2) {
            // console.log(todaysOrderData[i]['item'][j])
            // todaysOrderData[i]['item'].splice(j, 1)
            let status = (item.fulfillmentStatus ? item.fulfillmentStatus : 0)
            _.remove(orderData['data'][0]['item'], { 'fulfillmentStatus': 2 })

          }
        })

        return this.success(req, res, this.status.HTTP_OK, orderData, this.messageTypes.salesOrderDetailsFetched);
      }
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
          state: 3
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
        'delivery_type': 'N/A',
        'shipping_point': saleOrderDetails.plant,
        'delivery_no': 'N/A',
        'picking_date': moment(new Date()).format('YYYY-MM-DD'),
        'delivery_date': saleOrderDetails.req_del_date || moment(new Date()).format('YYYY-MM-DD'),
        'picking_time': moment(new Date()).format('hh:mm:ss'),
        'sales_order_no': saleOrderDetails.sales_order_no,
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
          'isItemPicked': 1,
          'updatedAt': 1,
          'isStartedPicking': 1,
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
        return this.success(req, res, this.status.HTTP_OK, {
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
          '_id': mongoose.Types.ObjectId(req.params.pickerBoySalesOrderMappingId),
          'isDeleted': 0
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

          let discountForSingleItem = parseFloat((item.discountPercentage / 100 * parseInt(item.mrp_amount)).toFixed(2))
          let discountForSupliedItem = discountForSingleItem * item.pickedQuantity
          totalDiscount = totalDiscount + discountForSupliedItem;

          //calculating selling price after discount

          let amountAfterDiscountForSingle = parseInt(item.total_amount) - discountForSingleItem;
          // let amountAfterDiscountForSuppliedItem = amountAfterDiscountForSingle * item.pickedQuantity

          /**
           * Calculating total amount formula
           * No. of quantity picked * MRP amount
           */

          totalAmount = parseInt(totalAmount) + (parseInt(item.pickedQuantity) * parseInt(item.mrp_amount))
          // calculating the tax amount 
          const cgstValue = parseFloat(item['cgst-pr']); // Converting to number
          let taxValueForSingleItemCGST = parseFloat((amountAfterDiscountForSingle * cgstValue / 100).toFixed(2))
          let amountAfterCgstTaxForSingle = amountAfterDiscountForSingle + taxValueForSingleItemCGST;
          let CgstTaxValueForSuppliedItem = taxValueForSingleItemCGST * item.suppliedQty
          totalCgstTax = totalCgstTax + CgstTaxValueForSuppliedItem;

          // calculating the tax amount for SGST
          const sgstValue = parseFloat(item['sgst_pr']); // Converting to number
          let taxValueForSingleItemSGST = parseFloat((amountAfterDiscountForSingle * sgstValue / 100).toFixed(2))
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
        salesOrderData[0].totalAmount = totalAmount == 0 ? "0" : totalAmount.toString().replace(/^0+/, '')
        salesOrderData[0].totalCgstTax = totalCgstTax
        salesOrderData[0].totalSgstTax = totalSgstTax
        salesOrderData[0].totalDiscount = totalDiscount
        salesOrderData[0].totalNetValue = totalNetValue
        return this.success(req, res, this.status.HTTP_OK, {
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
        searchKey = req.query.searchKey || '',
        pickerBoyId = req.user._id,
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


        'isItemPicked': true,
        'isStartedPicking': true,
        'invoiceDetail.isInvoice': false,
        'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId)

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
      // console.log('searchObject', searchObject);

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
                'pickingDate': 1,
                'updatedAt': 1,
                'created_at': 1,
                'numberOfItems': { $cond: { if: { $isArray: "$item" }, then: { $size: "$item" }, else: "NA" } }

              }
            }
          ],
          as: 'salesOrdersDetails'
        }
      },
      {
        $project: {
          'salesOrderId': 1,
          'pickerBoyId': 1,
          'InvoiceId': 1,
          'state': 1,
          'sales_order_no': 1,
          'pickingDate': 1,
          'orderDate': { $arrayElemAt: ['$salesOrdersDetails.created_at', 0] },
          'deliveryDate': { $arrayElemAt: ['$salesOrdersDetails.updatedAt', 0] },
          'invoiceDate': { $arrayElemAt: ['$salesOrdersDetails.updatedAt', 0] },
          'numberOfItems': { $arrayElemAt: ['$salesOrdersDetails.numberOfItems', 0] }
        }
      }

      ]).allowDiskUse(true)
      // success
      if (salesOrderList.length) {
        return this.success(req, res, this.status.HTTP_OK, {

          results: salesOrderList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalCount
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


  // Internal Function get picking Status / Delivery Number  details
  getPickingDetails = (pickerBoySalesOrderMappingId) => {
    try {
      info('Get SO Picking Details !');

      // get details 
      return Model.findOne({
        _id: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId),

        delivery_no: { $ne: 'N/A' },
        isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in PickerBoy Order Mapping DB!');
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

  // Internal Function get invoice detail 
  getInvoiceDetails = (pickerBoySalesOrderMappingId) => {
    try {
      info('Get SO Picking Details !');

      // get details 
      return Model.findOne({
        _id: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId),
        'invoiceDetail.isInvoice': true,
        delivery_no: { $ne: 'N/A' },
        isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in PickerBoy Order Mapping DB!');
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
        isItemPicked: true
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
        searchKey = req.query.searchKey || '',
        plant = req.user.plant,
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = req.user.locationId || 0, // locationId 
        cityId = req.user.cityId || 'N/A', // cityId 
        searchDate = req.query.searchDate || req.body.searchDate || '';
      console.log(searchDate)
      // let startOfTheDay = moment().set({
      //   h: 0,
      //   m: 0,
      //   s: 0,
      //   millisecond: 0
      // }).toDate();

      // // getting the end of the day 
      // let endOfTheDay = moment().set({
      //   h: 24,
      //   m: 24,
      //   s: 0,
      //   millisecond: 0
      // }).toDate();
      let startOfTheDay = moment(new Date()).format('YYYY-MM-DD');
      let yasterdayDate = moment(new Date()).subtract(3, 'days').format('YYYY-MM-DD')

      if (searchDate && !_.isEmpty(searchDate)) {
        // console.log('he');
        startOfTheDay = moment(searchDate, "DD-MM-YYYY").format('YYYY-MM-DD');
        yasterdayDate = moment(searchDate, "DD-MM-YYYY").subtract(1, 'days').format('YYYY-MM-DD')

        // startOfTheDay = moment(searchDate, 'DD-MM-YYYY').set({
        //   h: 0,
        //   m: 0,
        //   s: 0,
        //   millisecond: 0
        // }).toDate();

        // // getting the end of the day 
        // endOfTheDay = moment(searchDate, 'DD-MM-YYYY').set({
        //   h: 24,
        //   m: 24,
        //   s: 0,
        //   millisecond: 0
        // }).toDate();
      }

      //creating the object with query details to pass , in order to get the sales order details
      let salesQueryDetails = {
        plant,
        page,
        pageSize,
        searchKey,
        sortBy,
        locationId,
        cityId,
        yasterdayDate,
        startOfTheDay
      }
      // console.log('salesQueryDetails', salesQueryDetails);

      // finding the  data from the db 
      let salesOrderData = await SalesOrderCtrl.getPartialSalesOrder(salesQueryDetails);
      // success
      console.log(salesOrderData)
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
        searchKey = '', //req.query.search ||
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||
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
        // console.log('he');

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

      let hisoryData = await SalesOrderCtrl.getHistorySalesOrder(salesQueryDetails);
      // console.log(hisoryData)
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
  getOrderHistoryByPickerBoyID = async (req, res, next) => {
    try {
      info('Get History  Order details !');

      // let { sortBy, page, pageSize, locationId, cityId, searchKey, startOfTheDay, endOfTheDay } = req.query
      // let sortingArray = {};
      // sortingArray[sortBy] = -1;
      // let skip = parseInt(page - 1) * pageSize;
      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.searchKey || '',
        sortBy = req.query.sortBy || 'req_del_date',
        sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // item count missing
      let searchObject = {
        'pickerBoyId': mongoose.Types.ObjectId(req.user._id), //req.user._id,
        'invoiceDetail.isInvoice': true
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
            'sales_order_no': {
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
      // console.log(...searchObject)
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
      },
      {
        $lookup: {
          from: 'pickerboysalesorderitemsmappings',
          localField: '_id',
          foreignField: 'pickerBoySalesOrderMappingId',
          as: 'orderedItem'

        }
      },
      { $unwind: "$orderedItem" }

        , {
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
          'shippingId': 1,
          'cityId': 1,
          'plant': 1,
          'sales_order_no': 1,
          'state': 1,
          'invoiceDetail.invoice.invoiceId': 1,
          'req_del_date': 1,
          'salesOrderId': 1,
          'fulfillmentStatus': 1,
          'delivery_date': 1,
          'pickingDate': 1,
          'shipping_point': 1,

          'numberOfItems': { $cond: { if: { $isArray: "$orderedItem.itemDetail" }, then: { $size: "$orderedItem.itemDetail" }, else: "NA" } }
        }
      }
      ]).allowDiskUse(true)
      // console.log(salesOrderList)
      // return {
      //   success: true,
      //   data: salesOrderList,
      //   total: totalCount
      // };
      if (salesOrderList.length > 0) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: salesOrderList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalCount  //item
          }
        }, this.messageTypes.historyFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedHistoryDetails);


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



  //Fetch T and T-1,t-2,t-3 delivery SALESORDERS
  getTodaysOrder = async (req, res, next) => {
    let orderModel
    try {

      info('Getting the todays Order !!!');
      console.log(req.user)
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.searchKey || '',
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||
        searchDate = req.query.searchDate || '',
        type = req.params.type,
        plant = req.user.plant,
        sortingArray = {};
      sortingArray[sortBy] = -1;



      // 2021-03-29

      let startOfTheDay = moment(new Date()).format('YYYY-MM-DD');
      let yasterdayDate = moment(new Date()).subtract(3, 'days').format('YYYY-MM-DD')

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


        startOfTheDay = moment(searchDate, "DD-MM-YYYY").format('YYYY-MM-DD')

        // getting t-3
        yasterdayDate = moment(searchDate, "DD-MM-YYYY").format('YYYY-MM-DD')

      }




      let pipeline = [{
        $match: {

          $and: [
            {
              'req_del_date': {
                '$gte': yasterdayDate, '$lte': startOfTheDay

              }
            },
           
            {'sales_document_type':{$ne:'ZBRD'}},
            {'sales_document_type':{$ne:'ZRET'}},
            {'sales_document_type':{$ne:'ZREB'}}, {
              $or: [{ 'fulfillmentStatus': { $exists: true, $ne: 2 } }, {

                'fulfillmentStatus': { $exists: false }
              }]
            },


            { 'plant': { '$eq': plant.toString() } },
            {
              $or: [
                { 'item': { $exists: true, $not: { $size: 0 } } },
                { 'assets': { $exists: true, $not: { $size: 0 } } }
              ]
            },
            {
              $or: [{ 'overall_status': { $exists: true, $ne: 'Completely processed' } }, {

                'overall_status': { $exists: false }
              }]
            }


          ]


        }
      },
      {
        $sort: {
          '_id': -1
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

            $and: [
              {
                'req_del_date': {
                  '$gte': yasterdayDate, '$lte': startOfTheDay

                }
              },
              { 'sales_document_type': { $ne: 'ZBRD' } }, {
                $or: [{ 'fulfillmentStatus': { $ne: 2 } }, {

                  'fulfillmentStatus': { $exists: false }
                }]
              },

              {
                'plant': { '$eq': plant.toString() }
              },
              {
                $or: [
                  { 'item': { $exists: true, $not: { $size: 0 } } },
                  { 'assets': { $exists: true, $not: { $size: 0 } } }
                ]
              },
              {
                $or: [{ 'overall_status': { $exists: true, $ne: 'Completely processed' } }, {
  
                  'overall_status': { $exists: false }
                }]
              }],




            $or: [{
              'sales_order_no': {
                $regex: searchKey,
                $options: 'is'
              }
            }, {
              'sold_to_party': {
                $regex: searchKey,
                $options: 'is'
              }
            }, {
              'sold_to_party_description': {
                $regex: searchKey,
                $options: 'is'
              }
            }, {
              'customer_type': {
                $regex: searchKey,
                $options: 'is'
              }
            }]


          }
        },
        {
          $sort: {
            '_id': -1
          }
        },
        {
          $skip: (pageSize * (page - 1))
        }, {
          $limit: pageSize
        }
        ];
      // console.log('searchObject', pipeline);



      // get list





      switch (type) {

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
                      'invoiceDetail.isInvoice': false,

                      $and: [{ 'isStartedPicking': true },
                      { 'isItemPicked': true }],


                      'status': 1,
                      'isDeleted': 0,
                      '$expr': {
                        '$eq': ['$salesOrderId', '$$orderId']
                      }
                    }
                  },
                  {
                    $sort: {
                      'order_date': -1
                    }
                  },
                  {
                    $sort: {
                      'createdAt': -1
                    }
                  }
                ],
                as: 'pickingStatus'
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
                      'invoiceDetail.isInvoice': false,
                      'status': 1,
                      'isDeleted': 0,
                      '$expr': {
                        '$eq': ['$assetTransferId', '$$orderId']
                      }
                    }
                  },
                  {
                    $sort: {
                      'createdAt': -1
                    }
                  }
                ],
                as: 'pickingStatus'
              }
            }
          )
          console.log(req.user.plant)
          orderModel = require('../../MyTrip/assign_trip/model/assetTransfer.model')
          break;
        default:
          orderModel = salesOrderModel
          break;

      }

      let totalOrderCount = await orderModel.countDocuments({

        'req_del_date': {
          '$gte': yasterdayDate, '$lte': startOfTheDay
          // '$eq': startOfTheDay
        },

        $and: [{
          $or: [{ 'fulfillmentStatus': { $exists: true, $ne: 2 } }, {

            'fulfillmentStatus': { $exists: false }
          }]
        },


        { 'plant': { '$eq': plant.toString() } },
        {
          $or: [
            { 'item': { $exists: true, $not: { $size: 0 } } },
            { 'assets': { $exists: true, $not: { $size: 0 } } }
          ]
        }]



      })

      let todaysOrderData = await orderModel.aggregate(pipeline)
      // let todaysOrderData = await orderModel.find({'req_del_date':'2021-03-29'})
      console.log(todaysOrderData)

      todaysOrderData.forEach((items, i) => {
        items['item'].forEach((item, j) => {
          // console.log(parseInt(item.qty),parseInt(item.suppliedQty?item.suppliedQty:0),(parseInt(item.qty)-parseInt(item.suppliedQty?item.suppliedQty:0)))
          todaysOrderData[i]['item'][j]['qty'] = (parseInt(item.qty) - parseInt(item.suppliedQty ? item.suppliedQty : 0)).toString()
          if ((item.fulfillmentStatus ? item.fulfillmentStatus : 0) == 2) {
            // console.log(todaysOrderData[i]['item'][j])
            // todaysOrderData[i]['item'].splice(j, 1)
            let status = (item.fulfillmentStatus ? item.fulfillmentStatus : 0)
            _.remove(todaysOrderData[i]['item'], { 'fulfillmentStatus': 2 })

          }
        })
      })

      // fix require 
      // _.remove(todaysOrderData, { 'fulfillmentStatus': 2 })
      // todaysOrderData = todaysOrderData.filter(await function(sub) {
      //   return sub['item'].length;
      // });
      if (todaysOrderData.length > 0) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: todaysOrderData,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalOrderCount  //total so
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


  updateItemPickStatus = async (id, status) => {

    return await Model.updateIsItemPickedStatus(id, status);



  }

  getOrderItem = async (pickerboySalesOrderMappingId, item_no) => {
    return Model.aggregate([
      { '$match': { '_id': mongoose.Types.ObjectId(pickerboySalesOrderMappingId) } },
      {
        '$lookup': {
          'from': 'salesorders',
          'let': { 'so_id': '$salesOrderId' },
          'pipeline': [
            // {'$unwind': { path: '$item'} },
            {
              '$match': {

                '$expr': {
                  '$and': [
                    { $eq: ['$_id', '$$so_id'] },
                    // {$eq:[ '$item.item_no',item_no]}
                  ]
                }
              }
            }


          ],
          as: "salesOrders"
        }
      }
    ]).allowDiskUse(true).then((res) => {
      let plant = res[0]['salesOrders'][0]['plant'];
      // console.log(res[0])
      let item = res[0]['salesOrders'][0]['item'].filter(item => item['item_no'] === item_no);
      // console.log('item',_.isEmpty(item))
      if (item && !_.isEmpty(item)) {
        return {
          success: true,
          data: { 'salesOrder': item[0], 'plant': res[0]['salesOrders'][0]['plant'] }


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


  getOrderDetail = async (pickerBoyOrderMappingId) => {
    return Model.getOrderByPickerBoyId(pickerBoyOrderMappingId);
  }

  getOrderDetailByPickerBoyId = async (pickerBoyId) => {
    return await Model.findOne(
      {
        $and: [
          { 'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId) },
          { 'isStartedPicking': true }, { 'isItemPicked': true },
          { 'invoiceDetail.isInvoice': false }
        ]
      }).lean().then((res) => {

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


  updateFullFilmentStatus = (pickerBoyOrderMappingId, status) => {
    return Model.updateFullFilmentStatus(pickerBoyOrderMappingId, status);
  }
  // fix require




  getInvoices = async (req, res, next) => {

    try {

      info('Getting the todays Order !!!');

      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.searchKey || '',

        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||

        startDate = req.query.startDate || moment().subtract(100, 'days').set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate(),
        endDate = req.query.endDate || moment().set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0
        }).toDate(),
        type = req.params.type,
        // plant = req.body.plant,
        sortingArray = {};
      sortingArray[sortBy] = -1;
      console.log(startDate, endDate)


      if (startDate && !_.isEmpty(startDate)) {


        startDate = moment(startDate, "DD-MM-YYYY").set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate();


      }

      if (endDate && !_.isEmpty(endDate)) {


        endDate = moment(endDate, "DD-MM-YYYY").set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0
        }).toDate();


      }
      info('Get Invoices !');

      let pipeline = [{
        $match: {
          'createdAt': { $gte: startDate, $lte: endDate },
          'isStartedPicking': false,
          'isItemPicked': false,




        }
      },
      {
        $lookup: {
          from: 'invoicemasters',
          let: {
            id: '$invoiceDetail.invoice.invoiceDbId'
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ['$$id', '$_id']
              }

            }

          }
          ],
          as: "invoice"

        }
      }
        , {
        $project: {

          'state': 1,
          'remarks': 1,
          'shipping_point': 1,
          'delivery_no': 1,
          'delivery_date': 1,
          'sales_order_no': 1,
          'salesOrderId': 1,
          'pickerBoyId': 1,
          'createdBy': 1,
          'pickingDate': 1,
          'createdAt': 1,
          'updatedAt': 1,

          'invoice_request': 1,
          'invoice_response': 1,
          'picking_allocation_request': 1,
          'picking_allocation_response': 1,
          'isSapError': 1,
          'cityId': { $first: '$invoice.cityId' },
          'customerName': { $first: '$invoice.customerName' },
          'companyDetails': { $first: '$invoice.companyDetails' },
          'payerDetails': { $first: '$invoice.payerDetails' },
          'shippingDetails': { $first: '$invoice.shippingDetails' },
          'invoiceDetails': { $first: '$invoice.invoiceDetails' },
          'invoiceDate': { $first: '$invoice.invoiceDate' },
          'totalQuantitySupplied': { $first: '$invoice.totalQuantitySupplied' },
          'totalQuantityDemanded': { $first: '$invoice.totalQuantityDemanded' },
          'totalAmount': { $first: '$invoice.totalAmount' },
          'totalTax': { $first: '$invoice.totalTax' },
          'totalDiscount': { $first: '$invoice.totalDiscount' },
          'totalNetValue': { $first: '$invoice.totalNetValue' },
          'itemSupplied': { $first: '$invoice.itemSupplied' }
        }
      },
      {
        $sort: {
          'createdAt': -1
        }
      }
        // status: 1,
        // isDeleted: 0
      ]



      if (searchKey !== '')
        pipeline = [{
          $match: {
            'createdAt': { $gte: startDate, $lte: endDate },
            'isStartedPicking': false,
            'isItemPicked': false,




          }
        },
        {
          $lookup: {
            from: 'invoicemasters',
            let: {
              id: '$invoiceDetail.invoice.invoiceDbId'
            },
            pipeline: [{
              $match: {
                $expr: {
                  $eq: ['$$id', '$_id']
                }

              }

            }
            ],
            as: "invoice"

          }
        }
          , {
          $project: {


            'state': 1,
            'remarks': 1,
            'shipping_point': 1,
            'delivery_no': 1,
            'delivery_date': 1,
            'sales_order_no': 1,
            'salesOrderId': 1,
            'pickerBoyId': 1,
            'createdBy': 1,
            'pickingDate': 1,
            'createdAt': 1,
            'updatedAt': 1,

            'invoice_request': 1,
            'invoice_response': 1,
            'picking_allocation_request': 1,
            'picking_allocation_response': 1,
            'isSapError': 1,
            'cityId': { $first: '$invoice.cityId' },
            'customerName': { $first: '$invoice.customerName' },
            'companyDetails': { $first: '$invoice.companyDetails' },
            'payerDetails': { $first: '$invoice.payerDetails' },
            'shippingDetails': { $first: '$invoice.shippingDetails' },
            'invoiceDetails': { $first: '$invoice.invoiceDetails' },
            'invoiceDate': { $first: '$invoice.invoiceDate' },
            'totalQuantitySupplied': { $first: '$invoice.totalQuantitySupplied' },
            'totalQuantityDemanded': { $first: '$invoice.totalQuantityDemanded' },
            'totalAmount': { $first: '$invoice.totalAmount' },
            'totalTax': { $first: '$invoice.totalTax' },
            'totalDiscount': { $first: '$invoice.totalDiscount' },
            'totalNetValue': { $first: '$invoice.totalNetValue' },
            'itemSupplied': { $first: '$invoice.itemSupplied' }
          }
        },
        {
          $sort: {
            'createdAt': -1
          }
        }
          // status: 1,
          // isDeleted: 0
        ]


      // get details 
      return await Model.aggregate(pipeline).then((result) => {
        // console.log(result)
        if (result && !_.isEmpty(result)) {
          // return {
          //   success: true,
          //   data: res
          // }

          const json2csv = new Parser()

          try {
            // return this.success(req, res, this.status.HTTP_OK,result , this.messageTypes.invoiceDetailsSent);
            const csv = json2csv.parse(result)
            res.attachment(`report-${moment(startDate).format('DD:MM:YY')}-${moment(endDate).format('DD:MM:YY')}.csv`)
            res.status(200).send(csv)
          } catch (error) {
            console.log('error:', error.message)
            res.status(500).send(error.message)
          }


          // return this.success(req, res, this.status.HTTP_OK,result , this.messageTypes.invoiceDetailsSent);
        } else {
          error('Error Searching Data in invoice DB!');
          // return {
          //   success: false
          // }
          return this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.invoicesDetailsNotFound
          );
        }
      }).catch(err => {
        error(err);
        // return {
        //   success: false,
        //   error: err
        // }
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.invoicesDetailsNotFound
        );
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
      return this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
      // this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  getDeliveryNumberByPickerOrderId = async (pickerboyOrderMappingId) => {
    info('Fetching Delivery Number!')
    return await Model.findOne(
      {
        $and: [
          { '_id': mongoose.Types.ObjectId(pickerboyOrderMappingId) },
          { 'delivery_no': { $ne: 'N/A' } },
          { 'invoiceDetail.isInvoice': false }
        ]
      }, 'delivery_no').lean().then((res) => {

        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in picker boy order Mapping DB!');
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

  getOrderDetailByPickerBoyId = async (pickerBoyId) => {
    return await Model.findOne(
      {
        $and: [
          { 'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId) },
          { 'isStartedPicking': true }, { 'isItemPicked': true },
          { 'invoiceDetail.isInvoice': false }
        ]
      }).lean().then((res) => {

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


  updateFullfilmentStatus = (pickerBoyOrderMappingId, status) => {
    return Model.updateFullfilmentStatus(pickerBoyOrderMappingId, status);
  }

  updateDeliveryDate = async (req, res, next) => {
    let isDeliveryDateUpdated,  //updated Document detail
      type = req.params.type,    //type of order like salesorder,assetteansfer etc
      newDeliveryDate = moment(req.body.deliveryDate).format('YYYY-MM-DD') || moment(req.body.deliverydate).format('YYYY-MM-DD') || moment(new Date()).add(1, 'days').format('YYYY-MM-DD')  //updated delivery date from front end or todays date+1 if date is not present.
    try {

      // console.log(req.user.plant)
      info(`updating SO delivery date for - ${req.params.orderno},Delivery date - ${newDeliveryDate} !!!`);





      // 2021-03-29
      // let startOfTheDay =  moment(new Date()).format('YYYY-MM-DD');












      switch (type) {

        case 'salesorders':
          isDeliveryDateUpdated = await salesOrderModel.findOneAndUpdate({
            'sales_order_no': req.params.orderno
          }, {
            $set: {
              'req_del_date': newDeliveryDate,

            }
          },
            { 'new': true }
          )
          // console.log(isDeliveryDateUpdated)

          break;
        case 'spotsales':
          orderModel = spotSalesModel;

          break;
        case 'assettransfer':

          orderModel = require('../../MyTrip/assign_trip/model/assetTransfer.model')
          break;
        default:
          orderModel = salesOrderModel
          break;

      }






      if (isDeliveryDateUpdated) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: isDeliveryDateUpdated

        }, this.messageTypes.succesfullUpdateDeliveryDateForSelesOrder);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.deliveryDateUpdateFailedForSelesOrder);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // getOrderHistoryByPickerBoyID
  getOrderHistoryAndInvoices = async (req, res, next) => {
    try {
      info('Get History  Order details !');

      // let { sortBy, page, pageSize, locationId, cityId, searchKey, startOfTheDay, endOfTheDay } = req.query
      // let sortingArray = {};
      // sortingArray[sortBy] = -1;
      // let skip = parseInt(page - 1) * pageSize;
      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = '',//req.query.search || '',
        sortBy = req.query.sortBy || 'req_del_date',
        sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // item count missing
      let searchObject = {
        // 'pickerBoyId': mongoose.Types.ObjectId(req.user._id), //req.user._id,
        'salesOrderId': mongoose.Types.ObjectId(req.params.orderid),
        'invoiceDetail.isInvoice': true
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
      // console.log(...searchObject)
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
      },
      {
        $lookup: {
          from: 'invoicemasters',
          localField: 'invoiceDetail.invoice.invoiceDbId',
          foreignField: '_id',
          as: 'invoice'

        }
      },
      { $unwind: '$invoice' },
      { $unwind: '$salesOrderId' },
      {
        $group: {
          _id: '$sales_order_no', invoice: {
            $push: {
              'invoiceId': '$invoiceDetail.invoice.invoiceId',
              'suppliedQty': { '$sum': '$invoice.itemSupplied.suppliedQty' }, 'item_no': '$invoice.itemSupplied.item_no',
              'invoicedbid': '$invoiceDetail.invoice.invoiceDbId', 'date': '$invoice.createdAt'
            }
          },
          'customerName': { '$first': '$invoice.customerName' },
          'deliveryDate': { $first: '$delivery_date' },
          'sold_to_party': { $first: '$invoice.invoiceDetails.sold_to_party' }
        }
      }


        , {
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
          'shippingId': 1,
          'cityId': 1,
          'plant': 1,

          'sales_order_no': 1,
          'state': 1,
          'invoiceDetail.invoice.invoiceId': 1,
          'deliveryDate': 1,
          'salesOrderId': 1,
          'fulfillmentStatus': 1,
          'delivery_date': 1,
          'pickingDate': 1,
          'shipping_point': 1,
          'invoice': 1,
          'sold_to_party': 1
          // 'numberOfItems': { $cond: { if: { $isArray: "$invoice.itemSupplied" }, then: { $size: "$invoice.itemSupplied" }, else: "NA" } }
        }
      }

      ]).allowDiskUse(true)
      // console.log(salesOrderList)
      // return {
      //   success: true,
      //   data: salesOrderList,
      //   total: totalCount
      // };
      if (salesOrderList.length > 0) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: salesOrderList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: salesOrderList.length  //item
          }
        }, this.messageTypes.historyFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedHistoryDetails);


      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
      }
    }
  }


  // getOrderHistoryByPickerBoyID
  getPendingOrderAndInvoices = async (req, res, next) => {
    try {
      info('Get History  Order details !');

      // let { sortBy, page, pageSize, locationId, cityId, searchKey, startOfTheDay, endOfTheDay } = req.query
      // let sortingArray = {};
      // sortingArray[sortBy] = -1;
      // let skip = parseInt(page - 1) * pageSize;
      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = '',//req.query.search || '',
        sortBy = req.query.sortBy || 'req_del_date',
        orderid = req.params.orderid,
        sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // item count missing
      let searchObject = {
        // 'pickerBoyId': mongoose.Types.ObjectId(req.user._id), //req.user._id,
        'salesOrderId': mongoose.Types.ObjectId(orderid),
        'invoiceDetail.isInvoice': true
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
      // console.log(...searchObject)
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
      },
      {
        $lookup: {
          from: 'invoicemasters',
          localField: 'invoiceDetail.invoice.invoiceDbId',
          foreignField: '_id',
          as: 'invoice'

        }
      },
      {
        $lookup: {
          from: 'salesorders',
          localField: 'salesOrderId',
          foreignField: '_id',
          as: 'orderDetails'

        }
      },
      { $unwind: '$invoice' },
      { $unwind: '$salesOrderId' },
      {
        $group: {
          _id: '$sales_order_no', invoice: {
            $push: {
              'invoiceId': '$invoiceDetail.invoice.invoiceId',
              'suppliedQty': { '$sum': '$invoice.itemSupplied.suppliedQty' }, 'item_no': '$invoice.itemSupplied.item_no',
              'invoicedbid': '$invoiceDetail.invoice.invoiceDbId', 'date': '$invoice.createdAt'
            }
          },
          'customerName': { '$first': '$invoice.customerName' },
          'deliveryDate': { $first: '$delivery_date' },
          'item': { $first: { $first: '$orderDetails.item' } },
          'salesOrderId': { $first: { $first: '$orderDetails._id' } },
          'sold_to_party': { $first: '$invoice.invoiceDetails.sold_to_party' }
        }
      }



        , {
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
          'shippingId': 1,
          'cityId': 1,
          'plant': 1,
          'pickerboyOrderMappingId': 1,
          'sales_order_no': 1,
          'state': 1,
          'invoiceDetail.invoice.invoiceId': 1,
          'deliveryDate': 1,
          'salesOrderId': 1,
          'fulfillmentStatus': 1,
          'delivery_date': 1,
          'pickingDate': 1,
          'shipping_point': 1,
          'invoice': 1,
          'sold_to_party': 1,
          'orderDetails': 1,
          'item': 1
          // 'numberOfItems': { $cond: { if: { $isArray: "$invoice.itemSupplied" }, then: { $size: "$invoice.itemSupplied" }, else: "NA" } }
        }
      }

      ]).allowDiskUse(true)
      // console.log(salesOrderList)
      // return {
      //   success: true,
      //   data: salesOrderList,
      //   total: totalCount
      // };
      console.log(salesOrderList)
      if (salesOrderList.length > 0) {
        salesOrderList[0]['item'].forEach((item, j) => {
          console.log(item, parseInt(item.suppliedQty ? item.suppliedQty : 0), (parseInt(item.qty) - parseInt(item.suppliedQty ? item.suppliedQty : 0)))
          salesOrderList[0]['item'][j]['qty'] = (parseInt(item.qty) - parseInt(item.suppliedQty ? item.suppliedQty : 0))
          // if ((item.fulfillmentStatus ? item.fulfillmentStatus : 0) == 2) {
          // console.log(todaysOrderData[i]['item'][j])
          // todaysOrderData[i]['item'].splice(j, 1)



          // }
        })
        _.remove(salesOrderList[0]['item'], { 'fulfillmentStatus': 2 })
        return this.success(req, res, this.status.HTTP_OK, {
          results: salesOrderList[0],
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: salesOrderList.length  //item
          }
        }, this.messageTypes.historyFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedHistoryDetails);


      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
      }
    }
  }


  getInvoiceDetailById = async (req, res, next) => {

  }




  getInvoice = async (req, res, next) => {

    try {

      info('Getting the Invoice !!!');

      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.searchKey || '',
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||
        searchDate = req.query.searchDate || '',
        type = req.params.type,
        plant = req.user.plant,
        sortingArray = {};
      sortingArray[sortBy] = -1;



      // 2021-03-29
      let startOfTheDay = moment(new Date()).format('YYYY-MM-DD');
      let yasterdayDate = moment(new Date()).subtract(1, 'days').format('YYYY-MM-DD')

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
        yasterdayDate = moment(searchDate).subtract(1, 'days').format('YYYY-MM-DD')
        // endOfTheDay = moment(searchDate).format('YYYY-MM-DD')
      }




      let pipeline = [{
        $match: {
          'req_del_date': {
            '$gte': yasterdayDate, '$lte': startOfTheDay

          },
          $or: [{ 'fulfillmentStatus': { $ne: 2 } }, {

            'fulfillmentStatus': { $exists: false }
          }],


          'plant': { '$eq': plant.toString() },
          $or: [
            { 'item': { $exists: true, $not: { $size: 0 } } },
            { 'assets': { $exists: true, $not: { $size: 0 } } }
          ]


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
            'req_del_date': {
              '$gte': yasterdayDate, '$lte': startOfTheDay

            },
            $or: [{ 'fulfillmentStatus': { $ne: 2 } }, {

              'fulfillmentStatus': { $exists: false }
            }],


            'plant': { '$eq': plant.toString() },
            $or: [
              { 'item': { $exists: true, $not: { $size: 0 } } },
              { 'assets': { $exists: true, $not: { $size: 0 } } }
            ],




            $or: [{
              'sales_order_no': {
                $regex: searchKey,
                $options: 'is'
              }
            }, {
              'pickerBoyId': {
                $regex: searchKey,
                $options: 'is'
              }
            }, {
              'sold_to_party_description': {
                $regex: searchKey,
                $options: 'is'
              }
            }, {
              'customer_type': {
                $regex: searchKey,
                $options: 'is'
              }
            }]


          }
        }, {
          $sort: {
            'created_at': -1
          }
        },
        {
          $skip: (pageSize * (page - 1))
        }, {
          $limit: pageSize
        }];
      // console.log('searchObject', pipeline);



      // get list





      switch (type) {

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
                      'invoiceDetail.isInvoice': false,

                      $and: [{ 'isStartedPicking': true },
                      { 'isItemPicked': true }],


                      'status': 1,
                      'isDeleted': 0,
                      '$expr': {
                        '$eq': ['$salesOrderId', '$$orderId']
                      }
                    }
                  },
                  {
                    $sort: {
                      'createdAt': -1
                    }
                  }
                ],
                as: 'pickingStatus'
              }
            },
            {
              $project: {
                '_id': 1,
                'sales_order_no': 1,
                'req_del_date': 1,
                'sold_to_party': 1,
                'ship_to_party': 1,
                'plant': 1,
                'sold_to_party_description': 1,
                'fulfillmentStatus': 1,
                'pickingStatus': 1,
                'item': 1

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
                      'invoiceDetail.isInvoice': false,
                      'status': 1,
                      'isDeleted': 0,
                      '$expr': {
                        '$eq': ['$assetTransferId', '$$orderId']
                      }
                    }
                  },
                  {
                    $sort: {
                      'createdAt': -1
                    }
                  }
                ],
                as: 'pickingStatus'
              }
            }
          )
          console.log(req.user.plant)
          orderModel = require('../../MyTrip/assign_trip/model/assetTransfer.model')
          break;
        default:
          orderModel = salesOrderModel
          break;

      }

      let totalOrderCount = await orderModel.countDocuments({

        'req_del_date': {
          '$gte': yasterdayDate, '$lte': startOfTheDay
          // '$eq': startOfTheDay
        },
        $or: [{ 'fulfillmentStatus': { $ne: 2 } }, {

          'fulfillmentStatus': { $exists: false }
        }],


        'plant': { '$eq': plant.toString() },
        $or: [
          { 'item': { $exists: true, $not: { $size: 0 } } },
          { 'assets': { $exists: true, $not: { $size: 0 } } }
        ]



      })

      let todaysOrderData = await orderModel.aggregate(pipeline)
      // let todaysOrderData = await orderModel.find({'req_del_date':'2021-03-29'})
      console.log(todaysOrderData)

      todaysOrderData.forEach((items, i) => {
        items['item'].forEach((item, j) => {
          // console.log(parseInt(item.qty),parseInt(item.suppliedQty?item.suppliedQty:0),(parseInt(item.qty)-parseInt(item.suppliedQty?item.suppliedQty:0)))
          todaysOrderData[i]['item'][j]['qty'] = (parseInt(item.qty) - parseInt(item.suppliedQty ? item.suppliedQty : 0)).toString()
          if ((item.fulfillmentStatus ? item.fulfillmentStatus : 0) == 2) {
            // console.log(todaysOrderData[i]['item'][j])
            // todaysOrderData[i]['item'].splice(j, 1)
            let status = (item.fulfillmentStatus ? item.fulfillmentStatus : 0)
            _.remove(todaysOrderData[i]['item'], { 'fulfillmentStatus': 2 })

          }
        })
      })


      if (todaysOrderData.length > 0) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: todaysOrderData,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalOrderCount  //total so
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




  getInvoices = async (req, res, next) => {

    try {

      info('Getting the todays Order !!!');

      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.searchKey || '',

        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||

        startDate = req.query.startDate || moment().subtract(100, 'days').set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate(),
        endDate = req.query.endDate || moment().set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0
        }).toDate(),
        type = req.params.type,
        // plant = req.body.plant,
        sortingArray = {};
      sortingArray[sortBy] = -1;
      console.log(startDate, endDate)


      if (startDate && !_.isEmpty(startDate)) {


        startDate = moment(startDate, "DD-MM-YYYY").set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate();


      }

      if (endDate && !_.isEmpty(endDate)) {


        endDate = moment(endDate, "DD-MM-YYYY").set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0
        }).toDate();


      }
      info('Get Invoices !');

      let pipeline = [{
        $match: {
          'createdAt': { $gte: startDate, $lte: endDate },
          'isStartedPicking': false,
          'isItemPicked': false,




        }
      },
      {
        $lookup: {
          from: 'invoicemasters',
          let: {
            id: '$invoiceDetail.invoice.invoiceDbId'
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ['$$id', '$_id']
              }

            }

          }
          ],
          as: "invoice"

        }
      }
        , {
          $project: {

            'state': 1,
            'remarks': 1,
            'shipping_point': 1,
            'delivery_no': 1,
            'delivery_date': 1,
            'sales_order_no': 1,
            'salesOrderId': 1,
            'pickerBoyId': 1,
            'createdBy': 1,
            'pickingDate': 1,
            'createdAt': 1,
            'updatedAt': 1,

            'invoice_request': 1,
            'invoice_response': 1,
            'picking_allocation_request': 1,
            'picking_allocation_response': 1,
            'isSapError': 1,
            'cityId': { $first: '$invoice.cityId' },
            'customerName': { $first: '$invoice.customerName' },
            'companyDetails': { $first: '$invoice.companyDetails' },
            'payerDetails': { $first: '$invoice.payerDetails' },
            'shippingDetails': { $first: '$invoice.shippingDetails' },
            'invoiceDetails': { $first: '$invoice.invoiceDetails' },
            'invoiceDate': { $first: '$invoice.invoiceDate' },
            'totalQuantitySupplied': { $first: '$invoice.totalQuantitySupplied' },
            'totalQuantityDemanded': { $first: '$invoice.totalQuantityDemanded' },
            'totalAmount': { $first: '$invoice.totalAmount' },
            'totalTax': { $first: '$invoice.totalTax' },
            'totalDiscount': { $first: '$invoice.totalDiscount' },
            'totalNetValue': { $first: '$invoice.totalNetValue' },
            'itemSupplied': { $first: '$invoice.itemSupplied' }
          }
      },
      {
        $sort: {
          'createdAt': -1
        }
      }
        // status: 1,
        // isDeleted: 0
      ]



      if (searchKey !== '')
        pipeline = [{
          $match: {
            'createdAt': { $gte: startDate, $lte: endDate },
            'isStartedPicking': false,
            'isItemPicked': false,




          }
        },
        {
          $lookup: {
            from: 'invoicemasters',
            let: {
              id: '$invoiceDetail.invoice.invoiceDbId'
            },
            pipeline: [{
              $match: {
                $expr: {
                  $eq: ['$$id', '$_id']
                }

              }

            }
            ],
            as: "invoice"

          }
        }
          , {
            $project: {


              'state': 1,
              'remarks': 1,
              'shipping_point': 1,
              'delivery_no': 1,
              'delivery_date': 1,
              'sales_order_no': 1,
              'salesOrderId': 1,
              'pickerBoyId': 1,
              'createdBy': 1,
              'pickingDate': 1,
              'createdAt': 1,
              'updatedAt': 1,

              'invoice_request': 1,
              'invoice_response': 1,
              'picking_allocation_request': 1,
              'picking_allocation_response': 1,
              'isSapError': 1,
              'cityId': { $first: '$invoice.cityId' },
              'customerName': { $first: '$invoice.customerName' },
              'companyDetails': { $first: '$invoice.companyDetails' },
              'payerDetails': { $first: '$invoice.payerDetails' },
              'shippingDetails': { $first: '$invoice.shippingDetails' },
              'invoiceDetails': { $first: '$invoice.invoiceDetails' },
              'invoiceDate': { $first: '$invoice.invoiceDate' },
              'totalQuantitySupplied': { $first: '$invoice.totalQuantitySupplied' },
              'totalQuantityDemanded': { $first: '$invoice.totalQuantityDemanded' },
              'totalAmount': { $first: '$invoice.totalAmount' },
              'totalTax': { $first: '$invoice.totalTax' },
              'totalDiscount': { $first: '$invoice.totalDiscount' },
              'totalNetValue': { $first: '$invoice.totalNetValue' },
              'itemSupplied': { $first: '$invoice.itemSupplied' }
            }
        },
        {
          $sort: {
            'createdAt': -1
          }
        }
          // status: 1,
          // isDeleted: 0
        ]


      // get details 
      return await Model.aggregate(pipeline).allowDiskUse(true).then((result) => {
        // console.log(result)
        if (result && !_.isEmpty(result)) {
          // return {
          //   success: true,
          //   data: res
          // }

          const json2csv = new Parser()

          try {
            // return this.success(req, res, this.status.HTTP_OK,result , this.messageTypes.invoiceDetailsSent);
            const csv = json2csv.parse(result)
            res.attachment(`report-${moment(startDate).format('DD:MM:YY')}-${moment(endDate).format('DD:MM:YY')}.csv`)
            res.status(200).send(csv)
          } catch (error) {
            console.log('error:', error.message)
            res.status(500).send(error.message)
          }


          // return this.success(req, res, this.status.HTTP_OK,result , this.messageTypes.invoiceDetailsSent);
        } else {
          error('Error Searching Data in invoice DB!');
          // return {
          //   success: false
          // }
          return this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.invoicesDetailsNotFound
          );
        }
      }).catch(err => {
        error(err);
        // return {
        //   success: false,
        //   error: err
        // }
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.invoicesDetailsNotFound
        );
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
      return this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
      // this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }





}



// exporting the modules 
module.exports = new pickerboySalesOrderMappingController();