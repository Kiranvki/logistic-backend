const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const { error, info } = require('../../../utils').logging;
const moment = require('moment')
const SalesOrderModel = require('../../sales_order/sales_order/models/sales_order.model')
const invoiceMasterModel = require('../../picker_app/invoice_master/models/invoice_master.model')
const tripStageModel = require('./model/tripstages.model')
const vehicleCheckedInModel = require('../../vehicle/vehicle_attendance/models/vehicle_attendance.model');
const vehicleMasterModel = require('../../vehicle/vehicle_master/models/vehicle_master.model');
const deliveryExecModel = require('../../employee/delivery_executive/models/delivery_executive.model');
const tripModel = require('../assign_trip/model/trip.model');
const transporterModel = require('../../transporter/transporter/models/transporter.model');
const transVehicleModel = require('../../rate_category/ratecategory_transporter_vehicle_mapping/models/ratecategory_transporter_vehicle_mapping.model')
const _ = require('lodash');
const request = require('request-promise');

class MyTrip extends BaseController {

    // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.vehicle;
  };

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
            error(error);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
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
              if (!req.body.vehicleId) req.body.vehicleId = [];
              let getTransporter = await transporterModel.find({ _id: req.body.transporterId }).select('_id'); 
              getTransporter = await getTransporter.map((v)=> { return v._id })
              
              let vehicleIds = await transVehicleModel.find({transporterId: { $in: getTransporter } } ).select('vehicleId');
              vehicleIds = await vehicleIds.map( ( v ) => { return v.vehicleId });

        let alreadyCheckInVehicleIds = await vehicleCheckedInModel.find({
            'vehicleId': { $in: vehicleIds },
            'status': 1,
            'isDeleted': 0,
            'inTrip': 0,
            'dateOfAttendance': {
              '$gte': startOfTheDay,
              '$lte': endOfTheDay
            },
          }).lean();

          
          alreadyCheckInVehicleIds = await alreadyCheckInVehicleIds.map((v) => v.vehicleId);
        
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

      for (let v of req.body.vehicleId) {
        _.remove(vehicleList, (o) => { return o._id.toString() === v.toString(); });
      };
      
      return this.success(req, res, this.status.HTTP_OK, {
        results: vehicleList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalVehicle
        }
      });

        } catch (error) {
            console.log(error)
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
    };

    createTrip = async (req, res) => {
        try {
                let trip = {}, transporterDetails = req.body.transporterDetails, orderArray = [], vehicleArray = [], trip_ids=[];

                for ( let v of transporterDetails ) {

                  req.body.tripId = await tripModel.countDocuments() + 1; // Mandatory to create sequence incremental unique Id
                  if (!req.body.tripId) return false;
                  
                  req.body.transporterDetails = v
              
                  trip = await tripModel.create(req.body);
                  trip_ids.push(trip._id);
              
                let orders = await tripModel.findOne({ _id: trip._id })
                                   .populate('vehicleId rateCategoryId checkedInId salesOrderId deliveryExecutiveId invoice_db_id')
                                   .populate({ path: 'vehicleId', populate: {path: 'rateCategoryId'} })
                                   .lean();

                for (let so of orders.salesOrderId) {
                    
                    let orderObj = {};
                    let weight = _.find(orders.invoice_db_id, { so_db_id: so._id });
                    
                    so.totalWeight = weight.totalWeight;
                    let DeliveryDate = new Date(so.deliveryDate);
                    DeliveryDate = DeliveryDate.toISOString().split('T')[0];

                    let startOfTheDay = (DeliveryDate + " 00 00 00").toString();
                    let endOfTheDay = (DeliveryDate + " 23 59 00").toString();
                    
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
                    let cost = 0;

                    /*
                      If Rate Type Type Monthly ,
                      Total Cost =Fixed Rental + { Total Distance across all trip sheets in a month - Total Included Distance } * Cost per additional Km. 
                      If Total Distance across all trip sheets in a month - Total Included Distance is negative , kindly take Zero. 

                      If the Rate type is Daily ;

                      Cost = (Fixed Rental)+ { Total Distance across all trip sheets in day - (Total Included Distance)} *Cost per additional Km. 

                      If the Value (Total Included Distance * No of Days in month vehicles used by that specific transporter) is Negative , take as zero.

                    */
                    if (v.rateCategoryId && v.rateCategoryId.rateCategoryDetails) {
                      
                      let rentalAmount = v.rateCategoryId.rateCategoryDetails.fixedRentalAmount || 0;
                      let additionalAmount = v.rateCategoryId.rateCategoryDetails.additionalAmount || 0;

                      if (v.rateCategoryId.rateCategoryDetails.rateCategoryType === 'Monthly') {
                        cost = rentalAmount + (0 * additionalAmount) // Replace 0 with extra distance  
                      };

                      if (v.rateCategoryId.rateCategoryDetails.rateCategoryType === 'Daily') {
                        cost = rentalAmount + (0 * additionalAmount) // Replace 0 with extra distance
                      };

                    };

                    vehicleObj = {
                        vehicleId: transport ? transport.vehicleId : '',
                        name:  v.vehicleModel,
                        class: v.vehicleType,
                        capacity: v.tonnage,
                        cost:  cost
                    };

                    vehicleArray.push(vehicleObj);
                };

              };

                for (let v of req.body.checkedInId ) {
                  await vehicleCheckedInModel.findOneAndUpdate({ _id: v }, { $set: { inTrip: 1 } } ); 
                };

                for (let v of transporterDetails) {
                  await deliveryExecModel.findOneAndUpdate({ _id: v.deliveryExecutiveId }, { $set: { inTrip: 1 } }); 
                };
                
                return this.success(req, res, this.status.HTTP_OK, {trip_ids, orderArray, vehicleArray}, 'Trip Created !');    
            
            } catch (error) {
            console.log(error)
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
        }
    };

    getCheckedInVehicleCount = async (req, res) => {
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

        let vehicleCount = await vehicleCheckedInModel.countDocuments({
            'status': 1,
            'isDeleted': 0,
            'inTrip': 0,
            'dateOfAttendance': {
              '$gte': startOfTheDay,
              '$lte': endOfTheDay
            },
          }).lean();

          return this.success(req, res, this.status.HTTP_OK, {
            count: vehicleCount,
          });

      } catch (error) {
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
      };
    };

    getTrip = async (req, res) => {
      try {
        
        let trips = await tripModel.find({_id: { $in: req.body.tripIds } } )
                          .populate('vehicleId rateCategoryId checkedInId salesOrderId deliveryExecutiveId invoice_db_id')
                          .populate({ path: 'vehicleId', populate: { path: 'rateCategoryId' } })
                          .lean();

        return this.success(req, res, this.status.HTTP_OK, { result: trips });

      } catch (error) {
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
      };
    };

    spotSales = async (req, res) => {
      try {
         
      } catch (error) {
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
      };
    };

    getSalesMan = async (req, res) => {

      try {
        let response = {};

        let options = {
          method: 'POST',
          uri: '',
          headers: {
            //'x-auth-token': url['x-auth-token'], 
        },
          body: { salesManIds: [] },
          json: true
        };

        // response = await request(options);

        response = {
          "status": 200,
          "message": "Salesman List Fetched Successfully !",
          "data": {
              "results": [{
                  "_id": "601e4756021a634cf75bed03",
                  "location": {
                      "coordinates": []
                  },
                  "employerName": "Waycool Foods & Products Private Limited",
                  "isWaycoolEmp": 1,
                  "profilePic": null,
                  "recServerEmpId": null,
                  "status": 1,
                  "isDeleted": 0,
                  "employeeId": "WFP/1637/21",
                  "email": "anand.g@waycool.in",
                  "gender": "",
                  "aadharNumber": "0",
                  "zohoId": "378158000017386050",
                  "designation": "Senior Associate",
                  "pan": "",
                  "firstName": "Anand",
                  "lastName": "G",
                  "contactMobile": 9704410810,
                  "photo": "https://contacts.zoho.com/file?ID=738723471&fs=thumb",
                  "role": "Team member",
                  "employeeStatus": "Active",
                  "employeeType": "Permanent",
                  "locationName": "Bangalore",
                  "dateOfJoining": "2021-01-20T00:00:00.000Z",
                  "reportingTo": {
                      "id": "378158000010955069",
                      "name": "Raja Achutha Naidu Kottana WFP/905/20",
                      "emailId": "rajanaidu@waycool.in"
                  },
                  "agencyId": null,
                  "fullName": "Anand G",
                  "createdById": "5f89c48fcfafb9ff432dacd6",
                  "createdBy": "rajanaidu@waycool.in",
                  "warehouseId": "5f7aa79c34417a65b7eb66a1",
                  "cityId": "bangalore",
                  "createdAt": "2021-02-06T07:37:58.206Z",
                  "updatedAt": "2021-02-06T07:37:58.206Z",
                  "__v": 0,
                  "asmMapping": {
                      "_id": "601e4756021a634cf75bed04",
                      "status": 1,
                      "isDeleted": 0,
                      "asmId": {
                          "_id": "5fbf71a8d05b3c4626b7467e",
                          "status": 1,
                          "isDeleted": 0,
                          "employeeId": "WFP/1091/20",
                          "email": "raghavendra.n@waycool.in",
                          "gender": "male",
                          "designation": "Senior Associate Sales",
                          "firstName": "Raghavendra",
                          "lastName": "N",
                          "contactMobile": 6363222900,
                          "photo": "https://contacts.zoho.com/file?ID=724322711&fs=thumb"
                      },
                      "salesmanId": "601e4756021a634cf75bed03"
                  },
                  "numOfCustomersForTheDay": 18
              }],
              "pageMeta": {
                  "skip": 0,
                  "pageSize": 10,
                  "total": 56
              }
          }
        };

          let salesMan = response.data.results;

          return this.success(req, res, this.status.HTTP_OK, { result: salesMan });

      } catch (error) {
        console.log(error);
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
      };
    };

    getItemsByLocation = async (req, res) => {
      try {

        let cityId =  req.query.cityId || 'chennai', limit = 10, page = 1, skipRec = 0;

        limit = !req.query.limit ? limit = limit : limit = parseInt(req.query.limit);
        page = !req.query.page ? page = page - 1 : page = parseInt(req.query.page) - 1; 
      
        skipRec = page * limit;

        let query = { cityId: cityId };

        if (req.query.searchText) query = { cityId: cityId, itemName: { '$regex': req.query.searchText, '$options': 'i' } }; 
        
        const MongoClient = require('mongodb').MongoClient;
        let url = "mongodb://admin:myadminpassword@40.65.152.232:27017/";
  
        let db = await MongoClient.connect(url, { useUnifiedTopology: true });
        let dbo = db.db("dms");
        
        let items = await dbo.collection("itemmasters").find(query).skip(skipRec).limit(limit).toArray();

        await db.close();

        return this.success(req, res, this.status.HTTP_OK, { result: items });

      } catch (error) {

      }
    };

    getTriplisting = async (req, res) => {
      try {
        
        let trips = await tripModel.find({})
                          .populate('vehicleId rateCategoryId checkedInId salesOrderId deliveryExecutiveId invoice_db_id')
                          .populate({ path: 'vehicleId', populate: { path: 'rateCategoryId' } })
                          .lean();

        return this.success(req, res, this.status.HTTP_OK, { result: trips });

      } catch (error) {
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
      };
    };
};

module.exports = new MyTrip();
