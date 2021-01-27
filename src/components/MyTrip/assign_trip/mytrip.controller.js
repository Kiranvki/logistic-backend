const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const { error, info } = require('../../../utils').logging;
const moment = require('moment')
const SalesOrderModel = require('../../sales_order/sales_order/models/sales_order.model')
const invoiceMasterModel = require('../../picker_app/invoice_master/models/invoice_master.model')
const tripStageModel = require('./model/tripstages.model')
const vehicleCheckedInModel = require('../../vehicle/vehicle_attendance/models/vehicle_attendance.model');
const vehicleMasterModel = require('../../vehicle/vehicle_master/models/vehicle_master.model');
const tripModel = require('../assign_trip/model/trip.model');
const _ = require('lodash');

class MyTrip extends BaseController {

    // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.vehicle;
  }

    getSalesOrders = async (req, res) => {
        try {

            let cityId = req.query.cityId || 'chennai', endDate, startDate, limit = 10, page = 1, skipRec = 0;

            limit = !req.query.limit ? limit = limit : limit = parseInt(req.query.limit);
            page = !req.query.page ? page = page - 1 : page = parseInt(req.query.page) - 1; 
        
            skipRec = page * limit;

            startDate = !req.query.startDate ? startDate = new Date() : startDate = new Date(req.query.startDate)
            endDate = !req.query.endDate ? endDate = startDate : endDate = new Date(req.query.endDate);

            startDate = startDate.setHours(0,0,0,0);
            endDate = endDate.setHours(23,59,59,999);

            let projection = { 
                'cityId': cityId,
                'so_db_id': { $exists: true },
                'so_deliveryDate':  { '$gte': startDate, '$lte': endDate }
            };

            if (req.query.searchText && !req.query.searchText == '') {

                projection =  { ... projection, ...   {
                    '$or':  [ { 'invoiceNo': { $regex: req.query.searchText, $options: 'i' } },
                                { 'customerName': { $regex: req.query.searchText, $options: 'i' } }
                            ]
                } };
            };

            let getSalesOrder = await invoiceMasterModel.find(projection)
                                .populate({path: 'so_db_id', select: 'orderPK' })
                                .limit(limit)
                                .skip(skipRec)
                                .select('invoiceNo so_deliveryDate customerName cityId itemSupplied orderPK')
                                .lean();

            let totalRec = await SalesOrderModel.countDocuments(projection);
            let items = 0, quantity = 0;
            
            getSalesOrder = getSalesOrder.map( ( v ) => {
                items = v.itemSupplied.length;
                v.so_id =  v.so_db_id.orderPK;
                v.so_db_id = v.so_db_id._id;
                v.deliveryDate = v.so_deliveryDate
                v.items = items;
                v.itemSupplied.map( ( item ) => { quantity += item.quantity; } );
                v.quantity = quantity;
                quantity = 0;
                return v;
            }); 

            return this.success(req, res, this.status.HTTP_OK, {
                results: getSalesOrder,
                pageMeta: {
                  skip: parseInt(skipRec),
                  pageSize: limit,
                  total: totalRec
                }
              });
            
        } catch (err) {
            error(err);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
    };

    storeSelectedInvoices = async(req, res) => {
        try {

            let dataObj = {
                phase: 'select invoices',
                userId: '',
                isInvoicesSelected: true,
                selectInvoices: req.body.invoices
            }

            let storeInvoiceStag = await tripStageModel.create(dataObj);

        } catch (error) {
            error(err);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        };
    };

    getItemsByInvoiceId = async (req, res) => {
        try {

            let items = await invoiceMasterModel.findOne({ invoiceNo: req.params.invoiceNo }).select('invoiceNo soId itemSupplied').lean();
            return this.success(req, res, this.status.HTTP_OK, {
                results: items,
                success: true
              });

        } catch (error) {
            error(err);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        };
    };

    vehicleCountAndDetails = async (req, res) => {
        try {

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

        let alreadyCheckInVehicleIds = await vehicleCheckedInModel.find({
            'status': 1,
            'isDeleted': 0,
            'inTrip': 0,
            'dateOfAttendance': {
              '$gte': startOfTheDay,
              '$lte': endOfTheDay
            },
          }).lean();
          alreadyCheckInVehicleIds = await alreadyCheckInVehicleIds.map((v) => v.vehicleId);

           console.log(alreadyCheckInVehicleIds);

         alreadyCheckInVehicleIds = req.body.alreadyCheckInVehicleIds || [];
        
        let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // get the list of asm in the allocated city
      let searchObject = {
        'isDeleted': 0,
        '_id': {
          '$in': alreadyCheckInVehicleIds
        }
      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'regNumber': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'vehicleModel': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // // get the total rate category
      let totalVehicle = await vehicleMasterModel.countDocuments({
        ...searchObject
      });


      // get the Vehicle list 
      let vehicleList = await vehicleMasterModel.aggregate([{
        '$match': {
          ...searchObject
        }
      }, {
        '$sort': sortingArray
      }, {
        '$skip': skip
      }, {
        '$limit': pageSize
      },
      {
        $lookup: {
          from: 'ratecategorytransportervehiclemappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                // 'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$vehicleId', '$$id']
                }
              }
            }, {
              $project: {
                '_id': 1,
                'status': 1,
                'isDeleted': 1,
                'vehicleId': 1,
                'transporterId': 1,
                'rateCategoryId': 1
              }
            },
            {
              $lookup: {
                from: 'transporters',
                localField: "transporterId",
                foreignField: "_id",
                as: 'transporter'
              }
            },
            {
              $unwind: {
                path: '$transporter',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'ratecategorymodels',
                localField: "rateCategoryId",
                foreignField: "_id",
                as: 'rateCategory'
              }
            },
            {
              $unwind: {
                path: '$rateCategory',
                preserveNullAndEmptyArrays: true
              }
            },
          ],
          as: 'transporterRateCategoryDetails'
        }
      },
      {
        $unwind: {
          path: '$transporterRateCategoryDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'vehicleattendances',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                // 'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$vehicleId', '$$id']
                },
                'dateOfAttendance': {
                  '$gte': startOfTheDay,
                  '$lte': endOfTheDay
                },

              }
            }, {
              $project: {
                //  '_id': 0,
                'attendanceLog': 1,
                'vehicleId': 1,
                'dateOfAttendance': { $dateToString: { format: "%m-%d-%Y", date: "$dateOfAttendance", timezone: "+05:30" } },
              }
            },


            { $unwind: '$attendanceLog' },
            { $sort: { 'attendanceLog.checkInDate': 1 } },
            { $group: { _id: '$_id', 'attendanceLog': { $push: '$attendanceLog' } } },
            //   { $project: { 'attendanceLog': '$attendanceLog' } },


          ],
          as: 'attendanceDetails'
        },
      },
      {
        $unwind: {
          path: '$attendanceDetails',
          preserveNullAndEmptyArrays: true
        }
      },


      // { $unwind: '$attendanceDetails.attendanceLog' },
      // { $sort: { 'attendanceDetails.attendanceLog.checkInDate': 1 } },
      // { $group: { _id: '$attendanceDetails._id', 'attendanceLog': { $push: '$attendanceDetails.attendanceLog' } } },
      // // { $project: { 'attendanceDetails.attendanceLog': '$attendanceLog' } },

      {
        $project: {
          '_id': 1,
          'regNumber': 1,
          'vehicleType': 1,
          'vehicleModel': 1,
          'height': 1,
          'length': 1,
          'breadth': 1,
          'tonnage': 1,
          'status': 1,
          // 'rateCategoryId': '$transporterRateCategoryDetails.rateCategory._id',
          // 'rateCategoryName': '$transporterRateCategoryDetails.rateCategory.rateCategoryDetails.rateCategoryName',
          'rateCategoryDetails': '$transporterRateCategoryDetails.rateCategory',
          'attendanceDetails': 1,
          // 'attendanceDetails.attendanceLog': '$attendanceLog',
          'transporterId': '$transporterRateCategoryDetails.transporter._id',
          'transporterName': '$transporterRateCategoryDetails.transporter.vehicleDetails.name',
        }
      },
      ]).allowDiskUse(true);

      return this.success(req, res, this.status.HTTP_OK, {
        results: vehicleList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalVehicle
        }
      });

        } catch (error) {
            error(error);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
    };

    createTrip = async (req, res) => {
        try {
                req.body.tripId = await tripModel.countDocuments() + 1; // Mandatory to create sequence incremental unique Id
                if (!req.body.tripId) return false;
            
                let trip = await tripModel.create(req.body);
                
                let orders = await tripModel.findOne({ _id: trip._id })
                                   .populate('vehicleId checkedInId salesOrderId deliveryExecutiveId invoice_db_id')
                                   .lean();

                let orderArray = [], vehicleArray = [];

                for (let so of orders.salesOrderId) {
                    
                    let orderObj = {};
                    let weight = _.find(orders.invoice_db_id, { so_db_id: so._id });
                    
                    so.totalWeight = weight.totalWeight;
                    let DeliveryDate = new Date(so.deliveryDate);
                    DeliveryDate = DeliveryDate.toISOString().split('T')[0];

                    let startOfTheDay = (DeliveryDate + " 00 00 00").toString();
                    let endOfTheDay = (DeliveryDate + " 23 59 00").toString();
                    
                    console.log("startOfTheDay:", startOfTheDay, 'endOfTheDay:', endOfTheDay)
                    
                    orderObj = {
                        customerName: so.customerName,
                        customerCode: so.customerCode,
                        latitude: so.latitude,
                        longitude: so.longitude,
                        deliveryTimeStart: startOfTheDay,
                        deliveryTimeEnd: endOfTheDay,
                        orderWeight: so.totalWeight
                    };

                    orderArray.push(orderObj);
                };

                for (let v of orders.vehicleId) {
                    let vehicleObj = {}; 
                    let transport = _.find(orders.transporterDetails, { vehicleId: v._id });

                    vehicleObj = {
                        vehicleId: transport.vehicleId,
                        name:  v.vehicleModel,
                        class: v.vehicleType,
                        capacity: v.tonnage,
                        cost:  0
                    };

                    vehicleArray.push(vehicleObj)

                };
                
                return this.success(req, res, this.status.HTTP_OK, {orderArray, vehicleArray, trip}, 'Trip Created !');    
            } catch (error) {
            console.log(error)
            error(error);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
    };

};

module.exports = new MyTrip();
