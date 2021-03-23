// controllers 
const SalesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
const PickerBoyCtrl = require('../../employee/picker_boy/picker_boy.controller');
const AttendanceCtrl = require('../onBoard/app_picker_user_attendance/app_picker_user_attendance.controller');

const BasicCtrl = require('../../basic_config/basic_config.controller');
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
      let pickerboySalesOrderData = await Model.aggregate([{
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
                'itemDetails':1

              }
            }
          ],
          as: 'cartItems'
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
                'customerId': 1
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
          'salesOrdersDetails.soInvoiceNumber': 1,
          'salesOrdersDetails.paymentMode': 1,
          'salesOrdersDetails.upcomingDeliveryDate': 1,
          'salesOrdersDetails.deliveryNo': 1,
          'salesOrdersDetails.orderItems': 1,
          'pickerBoyId': 1,
          'customerType': 1,
          'salesOrderId': 1,
          'cartItems': 1
        }
      }
      ])

      // check if inserted 
      if (pickerboySalesOrderData && !_.isEmpty(pickerboySalesOrderData)) {
        return {
          success: true,
          data: pickerboySalesOrderData
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





  // get to do sales order details
  getToDoSalesOrder = async (req, res) => {
    try {
      info('Getting  Sales Order  Data !');
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

  // get details 
  getSalesOrder = async (req, res) => {
    try {
      info('SalesOrder GET DETAILS !');

      // get the sale Order Details
      let saleOrderDetails = req.body.saleOrderDetails;

      // check if inserted 
      if (saleOrderDetails && !_.isEmpty(saleOrderDetails)) return this.success(req, res, this.status.HTTP_OK, saleOrderDetails, this.messageTypes.salesOrderDetailsFetched);
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
        'salesOrderId': saleOrderDetails._id,
        'pickerBoyId': req.user._id,
        'createdBy': req.user.email,
        'pickingDate': new Date()
      };

      // inserting data into the db 
      let isInserted = await Model.create(dataToInsert);

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
        return this.success(req, res, this.status.HTTP_OK, salesOrderData, this.messageTypes.salesOrderDetailsFetched);
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
      let totalQuantityDemanded = 0, totalQuantitySupplied = 0,
        totalAmount = 0, totalTax = 0,
        totalDiscount = 0, totalNetValue = 0;

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
          as: 'cartItems'
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
                'orderItems':1
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
          'cartItems': 1,
          'salesOrdersDetails.orderItems':1
        }
      }
      ])

      // check if inserted 
      if (salesOrderData && !_.isEmpty(salesOrderData)) {
        //calculating the total basket amount -- needs to moved into hook
        //calculating the total quantity supplied and demanded

        await salesOrderData[0].cartItems.map((v, i) => {
          totalQuantitySupplied = v.suppliedQty + totalQuantitySupplied
          totalQuantityDemanded = v.quantity + totalQuantityDemanded
        });

        //calculating the discount and tax
        for (let item of salesOrderData[0].cartItems) {
          //calculating discount

          let discountForSingleItem = parseFloat((item.discountPercentage / 100 * item.salePrice).toFixed(2))
          let discountForSupliedItem = discountForSingleItem * item.suppliedQty
          totalDiscount = totalDiscount + discountForSupliedItem;

          //calculating selling price after discount

          let amountAfterDiscountForSingle = item.salePrice - discountForSingleItem;
          let amountAfterDiscountForSuppliedItem = amountAfterDiscountForSingle * item.suppliedQty
          totalAmount = totalAmount + amountAfterDiscountForSuppliedItem;

          // calculating the tax amount 

          let taxValueForSingleItem = parseFloat((amountAfterDiscountForSingle * item.taxPercentage / 100).toFixed(2))
          let amountAfterTaxForSingle = amountAfterDiscountForSingle + taxValueForSingleItem;
          let taxValueForSuppliedItem = taxValueForSingleItem * item.suppliedQty
          totalTax = totalTax + taxValueForSuppliedItem;

          //calculating net amount 
          let netValueForSingleItem = amountAfterDiscountForSingle - taxValueForSingleItem;
          let netValueForSuppliedItem = netValueForSingleItem * item.suppliedQty
          totalNetValue = totalNetValue + netValueForSuppliedItem;

          //adding all the values in item object
          item.discountForSingleItem = discountForSingleItem;
          item.amountAfterDiscountForSingle = amountAfterDiscountForSingle;
          item.amountAfterTaxForSingle = amountAfterTaxForSingle;
          item.taxValueForSingleItem = taxValueForSingleItem;
          item.netValueForSingleItem = netValueForSingleItem;

        }

        salesOrderData[0].totalQuantitySupplied = totalQuantitySupplied
        salesOrderData[0].totalQuantityDemanded = totalQuantityDemanded
        salesOrderData[0].totalAmount = totalAmount
        salesOrderData[0].totalTax = totalTax
        salesOrderData[0].totalDiscount = totalDiscount
        salesOrderData[0].totalNetValue = totalNetValue
        return this.success(req, res, this.status.HTTP_OK, salesOrderData, this.messageTypes.salesOrderDetailsFetched);
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
  isOrderInPickingState = (saleOrderId) => {
    try {
      info('Get SalesOrder  Details !');

      // get details 
      return Model.findOne({
        salesOrderId: mongoose.Types.ObjectId(saleOrderId),
        isDeleted: 0,
        state:1
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
      console.log('salesQueryDetails', salesQueryDetails);

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
      console.log('salesQueryDetails', salesQueryDetails);

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



}

// exporting the modules 
module.exports = new pickerboySalesOrderMappingController();
