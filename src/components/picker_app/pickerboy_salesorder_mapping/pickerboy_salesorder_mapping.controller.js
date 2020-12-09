// controllers 
const SalesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
const PockerBoyCtrl = require('../../employee/picker_boy/picker_boy.controller');
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
      let pickerBoyDetails = await PockerBoyCtrl.getPickerBoyFullDetails(req.user._id);

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
        'createdBy': req.user.email
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
                'suppliedQty': 1
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

  // get Customer list 
  getList = async (req, res) => {
    try {
      info('Get the Customer List !');

      // getting the data from request 
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        city = req.params.city,
        searchKey = req.query.search || '',
        isFilterApplicable = req.body.isFilterApplicable,
        validCustomerIds = req.body.validCustomerIds,
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {},
        customerType = process.env.customerType || 'GENERAL TRADE';

      sortingArray[sortBy] = 1;
      let skip = parseInt(page - 1) * pageSize;

      // project data 
      let fieldsToProject = {
        'goFrugalId': 1,
        'cityId': 1, // comparison field 
        'name': 1,
        'customerId': 1,
        'mobile': 1,
        'salesMan': 1,
        'status': 1,
        'type': 1,
        'creditLimit': 1,
        'dbStatus': 1,
        'createdAt': 1,
        'isDeleted': 1,
        'email': 1
      }

      let searchObject = {
        'cityId': city,
        // 'type': customerType,
        'isDeleted': 0
      };

      // creating a match object
      if (searchKey !== '' && isNaN(searchKey)) {
        searchObject = {
          ...searchObject,
          '$or': [{
            'name': {
              $regex: searchKey,
              $options: 'is'
            }
          }
            // , {
            //   'email': {
            //     $regex: searchKey,
            //     $options: 'is'
            //   }
            // }
          ]
        };
      } else if (searchKey !== '' && !isNaN(searchKey)) {
        searchObject = {
          ...searchObject,
          '$or': [{
            'goFrugalId': parseInt(searchKey)
          }]
        };
      }
      // if filter is applicable 
      if (isFilterApplicable) {
        searchObject = {
          ...searchObject,
          _id: {
            $in: validCustomerIds
          }
        }
      }

      // get the total customer
      let totalCustomer = await Model.countDocuments({
        ...searchObject
      });

      // getting th data from the customer db
      let customerList = await Model.aggregate([{
        '$project': fieldsToProject
      }, {
        '$sort': sortingArray
      }, {
        '$match': {
          ...searchObject
        }
      }, {
        '$skip': skip
      }, {
        '$limit': pageSize
      }, {
        '$lookup': {
          from: 'customersaccountmappings',
          let: {
            'id': '$goFrugalId',
            'city': '$cityId'
          },
          pipeline: [
            {
              $match: {
                'dbStatus': 1,
                'isDeleted': 0,
                'cityId': city,
                '$expr': {
                  '$eq': ['$goFrugalId', '$$id']
                }
              }
            }, {
              '$project': {
                'group': 1,
                'subGroup': 1,
                'overdueOutStanding': 1,
                'onAccount': 1,
                'totalOutStanding': 1,
                'creditDays': 1
              }
            }
          ],
          as: 'customerAccounts'
        }
      },
      // {
      //   '$lookup': {
      //     from: 'customersaccountmappings',
      //     localField: '_id',
      //     foreignField: 'customerId',
      //     as: 'customerAccounts'
      //   }
      // },
      // {
      //   '$unwind': {
      //     path: '$customerAccounts',
      //     preserveNullAndEmptyArrays: true
      //   }
      // }, 
      {
        "$addFields": {
          "customerAccounts": {
            $ifNull: [{ $arrayElemAt: ['$customerAccounts', -1] }, {
              'group': 'N/A',
              'subGroup': 'N/A',
              'overdueOutStanding': 0,
              'onAccount': 0,
              'totalOutStanding': 0,
              'creditDays': 0
            }]
          }
        }
      }, {
        '$project': {
          'customerAccounts': 1,
          'goFrugalId': 1,
          '_id': 1,
          'cityId': 1,
          'mobile': { $ifNull: ["$mobile", "N/A"] },
          'status': 1,
          'creditLimit': { $ifNull: ["$creditLimit", "N/A"] },
          'name': 1,
        }
      }]).allowDiskUse(true);

      let getTheStatusBasedOnCity = await CustomerSyncCtrl.getTheStatusBasedOnCity(city);
      let todayDate = new Date();
      let todayDay = todayDate.getDay();
      let weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

      // get the salesman assigned 
      for (let i = 0; i < customerList.length; i++) {
        let salesmanName = await DraftSalesmanCtrl.getTheSalesmanUsingCustomerId(customerList[i]._id, weekDays[todayDay]);
        if (salesmanName.success)
          customerList[i].salesmanName = salesmanName.data[0].draftBeatPlan.salesman ? salesmanName.data[0].draftBeatPlan.salesman.salesman : {
            '_id': '',
            'employerName': '',
            'fullName': 'N/A',
            'employeeId': 'N/A'
          };
        else customerList[i].salesmanName = {
          '_id': '',
          'employerName': '',
          'fullName': 'NOT ASSIGNED',
          'employeeId': 'N/A'
        };
      }

      // success
      return this.success(req, res, this.status.HTTP_OK, {
        results: customerList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalCustomer
        },
        syncStatus: getTheStatusBasedOnCity.success ? getTheStatusBasedOnCity.data : {}
      }, this.messageTypes.customerDetailsFetched);

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
        isDeleted: 0
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






}

// exporting the modules 
module.exports = new pickerboySalesOrderMappingController();
