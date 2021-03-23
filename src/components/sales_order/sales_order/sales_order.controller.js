// controllers 
const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const CustomerPaymentCtrl = require('../customers_payment_mapping/customers_payment_mapping.controller');
// const CustomerInvoiceCtrl = require('../customers_invoice_mapping/customers_invoice_mapping.controller');
// const CustomerDebitNoteCtrl = require('../customers_debit_mapping/customers_debit_mapping.controller');
// const CustomerCreditNoteCtrl = require('../customers_credit_mapping/customers_credit_mapping.controller');
// const CustomerAccountsCtrl = require('../customers_account_mapping/customers_account_mapping.controller');
// const DraftSalesmanCtrl = require('../../beat_plan/draft_day_customers/draft_day_customers.controller');

const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/sales_order.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;
const moment = require('moment');
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
class areaSalesManagerController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.salesOrder;
  }
  getDetails = async (saleOrderId) => {
    try {
      info('Get saleOrderId  details !');

      // get details 
      return await Model.findOne({
        _id: mongoose.Types.ObjectId(saleOrderId),
        // status: 1,
        // isDeleted: 0
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

      // catch any runtime error 
    } catch (err) {
      error(err);
      //   this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  updateSaledOrderToPack = async (saleOrderId) => {
    try {
      info('Get saleOrderId  details !');

      // creating data to insert
      let dataToUpdate = {
        $set: {
          isPacked: 1
        }
      };

      // get details 
      return await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(saleOrderId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      })
        .then((res) => {
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

      // catch any runtime error 
    } catch (err) {
      error(err);
      //   this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
  updateSalesOrderStatus = async (saleOrderId,soStatus) => {
    try {
      info('Get saleOrderId  details !');

      // creating data to insert
      let dataToUpdate = {
        $set: {
          fulfillmentStatus: soStatus
        }
      };

      // get details 
      return await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(saleOrderId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      })
        .then((res) => {
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

      // catch any runtime error 
    } catch (err) {
      error(err);
      //   this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
  // Internal Function get sales order details 
  getSalesOrderDetails = async (salesQueryDetails) => {
    try {
      info('Get Sales Order details !');
      let { sortBy, page, pageSize, locationId, cityId, searchKey, startOfTheDay, endOfTheDay, assignedSalesOrderId } = salesQueryDetails
      let sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;


      let searchObject = {
        // 'isPacked': 0,
        '_id': {
          $nin: assignedSalesOrderId
        },
        'locationId': parseInt(locationId),
        'cityId': cityId,

        'deliveryDate': {
          '$gte': startOfTheDay,
          '$lte': endOfTheDay
        }
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
          'onlineReferenceNo': 1,
          'customerCode': 1,
          'customerName': 1,
          'customerType': 1,
          'invoiceNo': 1,
          'numberOfItems': { $cond: { if: { $isArray: "$orderItems" }, then: { $size: "$orderItems" }, else: "NA" } }
        }
      }
      ]).allowDiskUse(true)

      return {
        success: true,
        data: salesOrderList,
        total: totalCount
      };

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
      }
    }
  }

  // Internal Function get the partial sales order details 
  getPartialSalesOrder = async (salesQueryDetails) => {
    try {
      info('Get Partial Sales Order details !');
      let { sortBy, page, pageSize, locationId, cityId, searchKey, startOfTheDay, endOfTheDay } = salesQueryDetails
      let sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;


      let searchObject = {
        // 'isPacked': 0,
        'fulfillmentStatus': 1,
        'locationId': parseInt(locationId),
        'cityId': cityId,

        'deliveryDate': {
          '$gte': startOfTheDay,
          '$lte': endOfTheDay
        }
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
          'onlineReferenceNo': 1,
          'customerCode': 1,
          'customerName': 1,
          'customerType': 1,
          'invoiceNo': 1,
          'fulfillmentStatus': 1,
          'numberOfItems': { $cond: { if: { $isArray: "$orderItems" }, then: { $size: "$orderItems" }, else: "NA" } }
        }
      }
      ]).allowDiskUse(true)

      return {
        success: true,
        data: salesOrderList,
        total: totalCount
      };

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
      }
    }
  }

  // get user details 
  get = async (req, res) => {
    try {
      info('Zoho Details Controller !');

      // success 
      return this.success(req, res, this.status.HTTP_OK, req.body.userData, this.messageTypes.userDetailsFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // create a new entry
  syncWithGoFrugal = async (req, res) => {
    try {
      info('Creating Sales Order  Data !');
      let city = req.params.city || req.body.city; // city 
      let errors = [];
      let salesOrderList = req.body.salesOrderList;
      // inserting data into the db 

      await Model.create(salesOrderList)
        .catch((err) => {
          error(`ERROR OCCURED FOR CITY - ${city},  ERROR - ${err}`);
          errors.push({
            city: city,
            error: err
          })
        });


      // go frugal sync
      req.cronLogger.info(`SALES ORDER GO FRUGAL SYNC | ${new Date()} | CITY - ${city} | TOTAL COUNT - ${req.body.salesOrderList.length} | ERROR - ${errors.length} | ${JSON.stringify(errors)} !`);


      // mark sales order sync completed 
      await SalesOrderSyncCtrl.markSalesOrderSyncSuccess(city);

      // success 
      return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.salesOrderInsertInitiated);

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

  // internal function
  getAllCustomersWithCityName = async (city) => {
    try {
      info('Get the Customer List ! for ', city);

      // project data 
      let dataToProject = {
        'goFrugalId': 1,
        'cityId': 1,
        'name': 1,
        'customerId': 1,
        'mobile': 1,
        'email': 1,
        'salesMan': 1,
        'salesManCode': 1,
        'salesManMobile': 1,
        'status': 1,
        'type': 1,
        'dbStatus': 1,
        'isDeleted': 1
      }

      // search object
      let searchObject = { 'cityId': city, 'isDeleted': 0 };

      // getting th data from the customer db
      let customerList = await Model.aggregate([{
        '$project': dataToProject
      }, {
        '$match': {
          ...searchObject
        }
      }]).allowDiskUse(true);

      // success
      return {
        success: true,
        data: customerList
      };

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
        'isDeleted': 1
      }

      // getting th data from the customer db
      let customerList = await Model.aggregate([{
        '$match': {
          '_id': mongoose.Types.ObjectId(customerId),
          'isDeleted': 0,
          'dbStatus': 1
        }
      }, {
        '$lookup': {
          from: 'customersaccountmappings',
          localField: '_id',
          foreignField: 'customerId',
          as: 'customerAccounts'
        }
      }, {
        '$unwind': {
          path: '$customerAccounts',
          preserveNullAndEmptyArrays: true
        }
      }, {
        '$lookup': {
          from: 'draftbeatplancustomers',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$customerId', '$$id']
                }
              }
            }, {
              $project: {
                'beatPlanId': 1,
                'status': 1,
                'isDeleted': 1,
              }
            }, {
              $group: {
                _id: '$beatPlanId'
              }
            }, {
              '$lookup': {
                from: 'draftbeatplans',
                let: {
                  'id': '$_id'
                },
                pipeline: [
                  {
                    $match: {
                      'status': 1,
                      'isDeleted': 0,
                      '$expr': {
                        '$eq': ['$_id', '$$id']
                      }
                    }
                  }, {
                    $project: {
                      '_id': 1,
                      'status': 1,
                      'isDeleted': 1,
                    }
                  }, {
                    '$lookup': {
                      from: 'draftbeatplansalesmanmappings',
                      let: {
                        'id': '$_id'
                      },
                      pipeline: [
                        {
                          $match: {
                            'status': 1,
                            'isDeleted': 0,
                            '$expr': {
                              '$eq': ['$beatPlanId', '$$id']
                            }
                          }
                        }, {
                          $project: {
                            'salesmanId': 1,
                            'status': 1,
                            'isDeleted': 1,
                          }
                        }, {
                          '$lookup': {
                            from: 'salesmanagers',
                            let: {
                              'id': '$salesmanId'
                            },
                            pipeline: [
                              {
                                $match: {
                                  'status': 1,
                                  'isDeleted': 0,
                                  '$expr': {
                                    '$eq': ['$_id', '$$id']
                                  }
                                }
                              }, {
                                $project: {
                                  'employerName': 1,
                                  'employeeId': 1,
                                  'isWaycoolEmp': 1,
                                  'fullName': 1,
                                  'email': 1,
                                  'contactMobile': 1,
                                  'profilePic': 1,
                                  'status': 1,
                                  'isDeleted': 1,
                                }
                              }, {
                                '$lookup': {
                                  from: 'asmsalesmanmappings',
                                  let: {
                                    'id': '$_id'
                                  },
                                  pipeline: [
                                    {
                                      $match: {
                                        'status': 1,
                                        'isDeleted': 0,
                                        '$expr': {
                                          '$eq': ['$salesmanId', '$$id']
                                        }
                                      }
                                    }, {
                                      $project: {
                                        'asmId': 1,
                                        'salesmanId': 1,
                                        'status': 1,
                                        'isDeleted': 1,
                                      }
                                    }, {
                                      '$lookup': {
                                        from: 'areasalesmanagers',
                                        let: {
                                          'id': '$asmId'
                                        },
                                        pipeline: [
                                          {
                                            $match: {
                                              'status': 1,
                                              'isDeleted': 0,
                                              '$expr': {
                                                '$eq': ['$_id', '$$id']
                                              }
                                            }
                                          }, {
                                            $project: {
                                              'profilePic': 1,
                                              'employeeId': 1,
                                              'fullName': 1,
                                              'status': 1,
                                              'isDeleted': 1,
                                            }
                                          }
                                        ],
                                        as: 'asm'
                                      }
                                    }, {
                                      '$unwind': {
                                        path: '$asm',
                                        preserveNullAndEmptyArrays: true
                                      }
                                    }
                                  ],
                                  as: 'asmMapping'
                                }
                              }, {
                                '$unwind': {
                                  path: '$asmMapping',
                                  preserveNullAndEmptyArrays: true
                                }
                              }
                            ],
                            as: 'salesman'
                          }
                        }, {
                          '$unwind': {
                            path: '$salesman',
                            preserveNullAndEmptyArrays: true
                          }
                        }
                      ],
                      as: 'salesman'
                    }
                  }, {
                    '$unwind': {
                      path: '$salesman',
                      preserveNullAndEmptyArrays: true
                    }
                  }
                ],
                as: 'beatPlan'
              }
            }, {
              '$unwind': {
                path: '$beatPlan',
                preserveNullAndEmptyArrays: true
              }
            }, {
              $match: {
                'beatPlan.status': {
                  $exists: true
                }
              }
            }
          ],
          as: 'beatPlans',
        }
      }]).allowDiskUse(true);

      // success
      return this.success(req, res, this.status.HTTP_OK, customerList[0], this.messageTypes.customerDetailsFetched);

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get customer details with city id and customer ids
  getDetailsWithCustomerIdsAndCityIds = (customerIds, cityids) => {
    try {
      info('Get Customer details !');

      // get details 
      return Model.find({
        _id: {
          $in: customerIds
        },
        cityId: {
          $in: cityids
        },
        dbStatus: 1,
        isDeleted: 0
      }).lean().then((res) => {
        if (res && res.length) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in Customer DB!');
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

  // get the minified list 
  getMinifiedListOld = async (req, res) => {
    try {
      info('Get the Customer List !');

      // get all the valid customers 
      let customerList = await CustomerAccountsCtrl.getMinifiedList(req);

      // success
      return this.success(req, res, this.status.HTTP_OK, customerList, this.messageTypes.customerDetailsFetched);

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get the minified list 
  getMinifiedList = async (req, res) => {
    try {
      info('Get the Customer Minified List !');

      // getting the data from request 
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        city = req.params.city,
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {},
        customerType = process.env.customerType || 'General Trade';

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // project data 
      let fieldsToProject = {
        'goFrugalId': 1,
        'customerId': 1,
        'name': 1,
        'cityId': 1,
        'dbStatus': 1,
        'isDeleted': 1,
        'group': 1,
        'createdAt': 1
      }

      let searchObject = {
        'cityId': city,
        // 'group': {
        //   $regex: 'General Trade',
        //   $options: 'is'
        // },
        'isDeleted': 0,
        'dbStatus': 1
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
          }]
        };
      } else if (searchKey !== '' && !isNaN(searchKey)) {
        searchObject = {
          ...searchObject,
          '$or': [{
            'goFrugalId': parseInt(searchKey)
          }]
        };
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
                '_id': 1
              }
            }
          ],
          as: 'customersaccountmappings'
        }
      }, {
        '$unwind': {
          path: '$customersaccountmappings',
          preserveNullAndEmptyArrays: true
        }
      }, {
        '$match': {
          ...searchObject,
          // 'customers': {
          //   $exists: true
          // }
        }
      }, {
        '$skip': skip
      }, {
        '$limit': pageSize
      }, {
        '$project': {
          'goFrugalId': 1,
          'name': 1,
          // '_id': '$customers._id'
        }
      }]).allowDiskUse(true);

      // success
      return this.success(req, res, this.status.HTTP_OK, {
        results: customerList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalCustomer
        },
      }, this.messageTypes.customerDetailsFetched);

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // internal function to check whether the customer ids are valid or not 
  isCustomerIdsValid = (customerIds) => {
    try {
      info('Get Customer details !');

      // get details 
      return Model.find({
        _id: {
          $in: customerIds
        },
        dbStatus: 1,
        isDeleted: 0
      }).lean().then((res) => {
        if (res && res.length == customerIds.length) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Some Ids are not valid !');
          let customerIdsFromRes = res.map((data) => data._id);
          let invalidCustomerIds = customerIds.filter((data) => {
            return (customerIdsFromRes.indexOf(data) < 0)
          })
          // returning back invalid customer ids 
          return {
            success: false,
            data: invalidCustomerIds
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

  // Internal function to sync the tally data 
  syncWithTallyOthers = async (req, res) => {
    try {
      info('Syncing with tally !');

      // type of tally data sync 
      let type = (req.params.type).toLowerCase(),
        city = (req.params.city).toLowerCase(),
        nothingToUpdate = false;

      info(`Total Emtries to Sync for this month - ${req.body.mappedCustomerPaymentArray.length} for city ${city}`);

      // check the data is present and mapped
      if (req.body.mappedCustomerPaymentArray && req.body.mappedCustomerPaymentArray.length) {
        if (type == 'payment') {
          CustomerPaymentCtrl.create(req.body.mappedCustomerPaymentArray, city);
          // delay
          await new timeout().sleep(1000); // 100 ns
          hitCustomerPaymentInvoiceSync('internal', city);
          // delay
        } else if (type == 'invoice') {
          CustomerInvoiceCtrl.create(req.body.mappedCustomerPaymentArray, city);
        } else if (type == 'debit') {
          CustomerDebitNoteCtrl.create(req.body.mappedCustomerPaymentArray, city);
        } else if (type == 'credit') {
          CustomerCreditNoteCtrl.create(req.body.mappedCustomerPaymentArray, city);
        } else if (type == 'accounts') {
          CustomerAccountsCtrl.create(req.body.mappedCustomerPaymentArray, city);
        }
      } else nothingToUpdate = true

      await new timeout().sleep(1000); // 100 ns

      // success
      return this.success(req, res, this.status.HTTP_OK, {
        isDataUpdate: !nothingToUpdate,
        unmappedCustomer: req.body.unmappedCustomerPaymentArray
      }, this.messageTypes.tallySynced);

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get the customer other details 
  getCustomerOtherDetails = async (req, res) => {
    try {
      info('Get the Customer Others Data !');
      let type = req.params.type;
      let customerOtherDetails = req.body.customerOtherDetails // get customer other details 

      // success
      return this.success(req, res, this.status.HTTP_OK, { data: customerOtherDetails.data || [], lastSyncTime: req.body.lastSyncTime }, this.messageTypes.customerOtherDetailsFetchedSuccess(type));

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get customer Full Details 
  getCompleteDetails = (customerId) => {
    try {
      info('Get Customer details !');

      // get details 
      return Model.aggregate([{
        $match: {
          _id: mongoose.Types.ObjectId(customerId)
        }
      }, {
        '$project': {
          'customerAlias': 0,
          'customerId': 0,
          'customerTypeCode': 0,
          'dbStatus': 0,
          'email': 0,
          'gstNumber': 0,
          'gstRegType': 0,
          'isCreditAllowed': 0,
          'isDeleted': 0,
          'isFree': 0,
          'isGstExempted': 0,
          'isOffer': 0,
          'isQty': 0,
          'priceLevelId': 0,
          'salesMan': 0,
          'salesManCode': 0,
          'salesManMobile': 0,
          'stateCode': 0,
          'status': 0,
          'syncTS': 0,
          'type': 0,
          'updatedAt': 0,
          'country': 0,
          'latitude': 0,
          'longitude': 0,
          'state': 0,
          'marriageDate': 0,
          'allowBilling': 0,
          'birthdate': 0,
        }
      }, {
        $lookup: {
          from: 'customersaccountmappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                'dbStatus': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$customerId', '$$id']
                }
              }
            }, {
              $project: {
                'name': 1,
                'group': 1,
                'subGroup': 1,
                'totalOutStanding': 1,
                'overdueOutStanding': 1,
                'creditDays': 1,
                'onAccount': 1
              }
            }
          ],
          as: 'customerAccounts'
        }
      },
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
              "name": "N/A",
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
        '$lookup': {
          from: 'customerscreditmappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$customerId', '$$id']
                }
              }
            }, {
              '$group': {
                _id: null,
                "numOfCredits": { $sum: 1 },
                "listOfCredits": { $push: "$creditNoteId" }
              }
            }
          ],
          as: 'customerCredits'
        }
      }, {
        "$addFields": {
          // "customerCredits": {
          //   $cond: {
          //     if: {
          //       $ne: ['$customerCredits', null]
          //     }, then: { $arrayElemAt: ['$customerCredits', -1] }, else: null
          //   }
          // }
          // "customerCredits": { $arrayElemAt: ['$customerCredits', -1] }
          "customerCredits": {
            $ifNull: [{ $arrayElemAt: ['$customerCredits', -1] }, {
              "numOfCredits": 0,
              "listOfCredits": []
            }]
          }
        }
      }, {
        '$lookup': {
          from: 'customersdebitmappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              '$match': {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$customerId', '$$id']
                }
              }
            }, {
              '$group': {
                _id: null,
                "numOfDebits": { $sum: 1 },
                "listOfDebits": { $push: "$debitNoteId" }
              }
            }
          ],
          as: 'customerDebits'
        }
      }, {
        "$addFields": {
          "customerDebits": {
            $ifNull: [{ $arrayElemAt: ['$customerDebits', -1] }, {
              "numOfDebits": 0,
              "listOfDebits": []
            }]
          }
        }
      }, {
        '$lookup': {
          from: 'customersinvoicemappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              '$match': {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$customerId', '$$id']
                }
              }
            }, {
              '$group': {
                _id: null,
                "numOfInvoices": { $sum: 1 },
                "listOfInvoices": { $push: "$invoiceId" }
              }
            }
          ],
          as: 'customerInvoices'
        }
      }, {
        "$addFields": {
          "customerInvoices": {
            $ifNull: [{ $arrayElemAt: ['$customerInvoices', -1] }, {
              "numOfInvoices": 0,
              "listOfInvoices": []
            }]
          }
        }
      }, {
        '$lookup': {
          from: 'customerspaymentmappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              '$match': {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$customerId', '$$id']
                }
              }
            }, {
              '$group': {
                _id: null,
                "numOfPayments": { $sum: 1 },
                "listOfPayments": { $push: "$_id" }
              }
            }
          ],
          as: 'customerPayments'
        }
      }, {
        "$addFields": {
          "customerPayments": {
            $ifNull: [{ $arrayElemAt: ['$customerPayments', -1] }, {
              "numOfPayments": 0,
              "listOfPayments": []
            }]
          }
        }
      }]).allowDiskUse(true).then((res) => {
        if (res && res.length) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in Customer DB!');
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

  // get customers without location
  getCustomerWithoutLocationFromGivenArray = (customerIdArray) => {
    try {
      info('Get the Customer List !');

      // get all the valid customers 
      return Model.aggregate([{
        $match: {
          '_id': {
            $in: customerIdArray
          },
          $or: [{
            'latitude': ''
          }, {
            'latitude': null
          }]
        }
      }, {
        '$project': {
          'address1': 1,
          'address2': 1,
          'address3': 1,
          'pincode': 1,
          'city': 1,
          'state': 1
        }
      }]).allowDiskUse(true)
        .then((data) => {
          if (data && data.length) {
            return {
              success: true,
              data: data
            };
          } else {
            return {
              success: false
            }
          }
        })

      // catch any runtime error
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // update lat and long 
  updatingLocation = (customerId, dataToUpdate) => {
    try {
      info(`Updating Customer Info ! ${customerId}`);

      // get details 
      return Model.findByIdAndUpdate(mongoose.Types.ObjectId(customerId), {
        ...dataToUpdate
      }).lean().then((res) => {
        if (res) {
          return {
            success: true,
            data: res
          };
        } else {
          error('Customer Not Updated !');
          return {
            success: false,
          };
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

  // insert customer raw 
  insertCustomerRaw = (dataToInsert, city) => {
    try {
      info(`Inserting Customer RAW !`);

      // get details 
      return Model.findOneAndUpdate({
        goFrugalId: dataToInsert.goFrugalId,
        cityId: city
      }, {
        ...dataToInsert,
        latitude: dataToInsert.latitude.replace(/[^\d.-]/g, ''),
        longitude: dataToInsert.longitude.replace(/[^\d.-]/g, ''),
        location: {
          type: 'Point',
          coordinates: [!isNaN(dataToInsert.longitude) ? dataToInsert.longitude : null, !isNaN(dataToInsert.latitude) ? dataToInsert.latitude : null]
        },
        dbStatus: 1,
        isDeleted: 0
      }, {
        upsert: true,
        lean: true,
        new: true,
        setDefaultsOnInsert: true
      }).lean().then((res) => {
        if (res) {
          return {
            success: true,
            data: res
          };
        } else {
          error('Customer Not Added !');
          return {
            success: false,
          };
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
}

// exporting the modules 
module.exports = new areaSalesManagerController();
