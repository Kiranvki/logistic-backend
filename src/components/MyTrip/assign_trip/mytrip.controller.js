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
const spotModel = require('./model/spotsales.model');
const assetModel = require('./model/assetTransfer.model');
const seriesModel = require('./model/incremental.model');
const tripSaleModel = require('./model/salesOrder.model')
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

    getTrip = async (req, res) => {
      try {
        
        let trips = await tripModel.find({_id: { $in: req.body.tripIds } } )
                          .populate('vehicleId spotSalesId rateCategoryId checkedInId salesOrderId deliveryExecutiveId invoice_db_id')
                          .populate({ path: 'vehicleId', populate: { path: 'rateCategoryId' } })
                          .lean();

          for (let trip of trips) {
            if (!trip.spotSalesId) trip.spotSalesId = {};
          };  

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
        
        let totalItems = await dbo.collection("itemmasters").countDocuments(query)
        totalItems = Math.ceil(totalItems / limit);
        
        let pageMeta = {
          "skip": skipRec,
          "pageSize": limit,
          "total": totalItems
      }
        await db.close();

        return this.success(req, res, this.status.HTTP_OK, { result: items, pageMeta });

      } catch (error) {

      }
    };

    getTriplisting = async (req, res) => {
      try {

        let cityId =  req.query.cityId || 'chennai', limit = 10, page = 1, skipRec = 0;

        limit = !req.query.limit ? limit = limit : limit = parseInt(req.query.limit);
        page = !req.query.page ? page = page - 1 : page = parseInt(req.query.page) - 1; 
      
        skipRec = page * limit;

        let query = {  };

        if (req.query.searchText) query = { cityId: cityId, itemName: { '$regex': req.query.searchText, '$options': 'i' } }; 
        
        
        let trips = await tripModel.find(query)
                          .skip(skipRec)
                          .limit(limit)
                          .populate('vehicleId rateCategoryId checkedInId salesOrderId deliveryExecutiveId invoice_db_id')
                          .populate({ path: 'vehicleId', populate: { path: 'rateCategoryId' } })
                          .lean();

        return this.success(req, res, this.status.HTTP_OK, { result: trips });

      } catch (error) {
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
      };
    };

    storeOnSpotSales = async (req, res) => {
      try {

         let trip = await tripModel.findOne({_id: req.body.tripId }).lean();
         if (!trip) return res.send({status: 200, message: 'incorrect trip id'});

         let spotId  = await seriesModel.findOne({ modelName: 'spotsales' }).lean();
         if (!spotId) spotId = await seriesModel.create({ modelName: 'spotsales', currentCount: 0 });
 
         let currentCount = spotId.currentCount + 1;
         req.body.spotId = currentCount; 
         req.body.spotIdAlias = currentCount;

         req.body.createdByEmpId = req.user.empId;
         req.body.createdById = req.user._id;

         let spotSales = await spotModel.create(req.body);

         await seriesModel.findOneAndUpdate({ _id: spotId._id }, { $set: { currentCount: currentCount } });

         await tripModel.findOneAndUpdate({ _id: trip._id }, {$set: { spotSalesId: spotSales._id} });

        return this.success(req, res, this.status.HTTP_OK, { result: spotSales });

      } catch (error) {
        console.log(error)
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error)); 
      };
    };

    //---------------------------------------------------------

    createSpotSales = async (req, res) => { // WithOut Trip Id
      try {

        if (!req.body.items.length) return 

        let spotId  = await seriesModel.findOne({ modelName: 'spotsales' }).lean();
        if (!spotId) spotId = await seriesModel.create({ modelName: 'spotsales', currentCount: 0 });

        let currentCount = spotId.currentCount + 1;
        req.body.spotId = currentCount; 
        req.body.spotIdAlias = currentCount;

        req.body.createdByEmpId = req.user.empId;
        req.body.createdById = req.user._id;
        
        let spotSales = await spotModel.create(req.body);
        await seriesModel.findOneAndUpdate({ _id: spotId._id }, { $set: { currentCount: currentCount } });
        
        return this.success(req, res, this.status.HTTP_OK, { result: spotSales });

      } catch (error) {
        console.log(error)
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error)); 
      };
    };
    
    getSpotSalesList = async (req, res) => {
      try {
        
        let cityId = req.query.cityId || 'chennai', endDate, startDate, limit = 10, page = 1, skipRec = 0;

        limit = !req.query.limit ? limit = limit : limit = parseInt(req.query.limit);
        page = !req.query.page ? page = page - 1 : page = parseInt(req.query.page) - 1; 
    
        skipRec = page * limit;

        startDate = !req.query.startDate ? startDate = new Date() : startDate = new Date(req.query.startDate)
        endDate = !req.query.endDate ? endDate = startDate : endDate = new Date(req.query.endDate);

        startDate = startDate.setHours(0,0,0,0);
        endDate = endDate.setHours(23,59,59,999);

        let projection = { 'cityId': cityId };

        if ( req.query.startDate || req.query.endDate ) {

          projection = { ... projection, ... {
            spotSalesDate:  { '$gte': startDate, '$lte': endDate }
          } }

        }; 

        if (req.query.searchText && !req.query.searchText == '') {

          projection =  { ... projection, ...   {
            '$or':  [ { 'spotIdAlias': { $regex: req.query.searchText, $options: 'i' } }, { 'salesManName': { $regex: req.query.searchText, $options: 'i' } } ]
        } };
          
      };

      let spotSales = await spotModel.find(projection).limit(limit).skip(skipRec).sort('-createdAt').lean();
      let totalRec = await spotModel.countDocuments(projection);

      return this.success(req, res, this.status.HTTP_OK, { result: spotSales, pageMeta: {
        skip: parseInt(skipRec),
        pageSize: limit,
        total: totalRec
      } });

      } catch (error) {
        console.log(error)
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error)); 
      };
    };

    storeAssetTransfer = async (req, res) => {
      try {

        let options = {
          method: 'GET',
          uri: 'http://uat.apps.waycool.in:3001/api/v1/warehouse/'+req.user.warehouseId,
          headers: {
            'x-access-token': req.user.token,
            'Content-Type': 'application/json' 
        },
          json: true
        };

        let response = await request(options);

        let assetRecId  = await seriesModel.findOne({ modelName: 'assetTransfer' }).lean();
        if (!assetRecId) assetRecId = await seriesModel.create({ modelName: 'assetTransfer', currentCount: 0 });

        let currentCount = assetRecId.currentCount + 1;
        
        req.body.assetRecId = currentCount; 
        req.body.assetRecIdAlias = currentCount;

        if (!req.body.cityId) req.body.cityId = req.user.region;
        
        req.body.sourceWarehouseName = response.data.name;
        req.body.sourceWarehouseId = req.user.warehouseId;

        req.body.createdByEmpId = req.user.empId;
        req.body.createdById = req.user._id;
        req.body.createdByName = req.user.firstName + ' ' + req.user.lastName;

        req.body.stage = [{
          name: 'created',
          empName: req.user.firstName + ' ' + req.user.lastName,
          dateTime: new Date()
        }];
        
        let assetTransfer = await assetModel.create(req.body);
        await seriesModel.findOneAndUpdate({_id: assetRecId._id }, { $set: { currentCount: currentCount } });

        return this.success(req, res, this.status.HTTP_OK, { result: assetTransfer });

      } catch (error) {
        console.log(error)
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error)); 
      };
    };

    getAssetTransfer = async (req, res) => {
      try {
       
        let cityId = req.query.cityId || 'chennai', endDate, startDate, limit = 10, page = 1, skipRec = 0;

        limit = !req.query.limit ? limit = limit : limit = parseInt(req.query.limit);
        page = !req.query.page ? page = page - 1 : page = parseInt(req.query.page) - 1; 
    
        skipRec = page * limit;

        startDate = !req.query.startDate ? startDate = new Date() : startDate = new Date(req.query.startDate)
        endDate = !req.query.endDate ? endDate = startDate : endDate = new Date(req.query.endDate);

        startDate = startDate.setHours(0,0,0,0);
        endDate = endDate.setHours(23,59,59,999);

        let projection = { 'cityId': cityId };

        if ( req.query.startDate || req.query.endDate ) {
          
          projection = { ... projection, ... {
            createdAt:  { '$gte': startDate, '$lte': endDate }
          } };

        }; 

        if (req.query.searchText && !req.query.searchText == '') {

          projection =  { ... projection, ...   {
            '$or':  [ { 'assetRecIdAlias': { $regex: req.query.searchText, $options: 'i' } }
            // , { 'salesManCode': { $regex: req.query.searchText, $options: 'i' } }
           ]
        } };
          
      };

      let assetlist = await assetModel.find(projection).limit(limit).skip(skipRec).sort('-createdAt').lean();
      let totalRec = await assetModel.countDocuments(projection);
      
      return this.success(req, res, this.status.HTTP_OK, { result: assetlist, pageMeta: {
        skip: parseInt(skipRec),
        pageSize: limit,
        total: totalRec
        } });

      } catch (error) {
        console.log(error)
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error)); 
      }
    };

    getCheckedInVehicleCount = async (req, res) => {
      try {
               
        let vehicleCount = await vehicleMasterModel.countDocuments({ 'status': 1, 'isDeleted': 0 }).lean();

        return this.success(req, res, this.status.HTTP_OK, {
          count: vehicleCount,
        });

      } catch (error) {
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
      };
    };

    vehicleCountAndDetails = async (req, res) => {
      try {

          if (!req.body.vehicleId) req.body.vehicleId = [];

          let getTransporter = await transporterModel.findOne({ _id: req.body.transporterId }).lean(); 
          
          let vehicleIds = await transVehicleModel.find({ 
          'transporterId': getTransporter._id,
          'status': 0,
          'isDeleted': 0,
          'vehicleId': { $nin: req.body.vehicleId }
         } ).select('vehicleId');

         vehicleIds = vehicleIds.map((v)=>{ return v.vehicleId });
         
         let vehicleList = await vehicleMasterModel.find({_id: { $in: vehicleIds }, 'inTrip': 0, 'status': 1, 'isDeleted': 0, }).select('-status -isDeleted -createdAt -updatedAt -__v').lean();
         let totalVehicle = await vehicleMasterModel.countDocuments({ _id: { $in: vehicleIds }, 'inTrip': 0, 'status': 1, 'isDeleted': 0, });
          
        return this.success(req, res, this.status.HTTP_OK, {
          results: vehicleList,
          pageMeta: {
            skip: 0,
            pageSize: 0,
            total: totalVehicle
          }
        });

      } catch (error) {
          console.log(error)
          this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
      }
    };

    createTrip = async (req, res) => {

      try {

        let salesOrderTripIds = [], tripIds = [], orderArray = [], vehicleArray = [];

        for (let Sotrip of req.body.salesOrder) {
          
            let salesOrderCode  = await seriesModel.findOne({ modelName: 'tripSalesOrder' }).lean();
            if (!salesOrderCode) salesOrderCode = await seriesModel.create({ modelName: 'tripSalesOrder', currentCount: 0 });
            
            let currentCount = salesOrderCode.currentCount + 1;
            
            Sotrip.salesOrderCode = currentCount; 
            Sotrip.salesOrderCodeAlias = currentCount;
    
            let soTrip = await tripSaleModel.create(Sotrip);
            await seriesModel.findOneAndUpdate({ _id: salesOrderCode._id }, { $set: { currentCount: currentCount } });
            
            salesOrderTripIds.push(soTrip._id);

        };
        
        for ( let trip of req.body.trips ) {
          
          let tripId  = await seriesModel.findOne({ modelName: 'trip' }).lean();
          if (!tripId) tripId = await seriesModel.create({ modelName: 'trip', currentCount: 0 });
          
          let currentCount = tripId.currentCount + 1;
          
          trip.tripId = currentCount; 
          trip.tripIdAlias = currentCount;

          if (trip.hasSalesOrderOrStcokTransfer === true ) {
            trip.salesOrderTripIds = salesOrderTripIds;
          };

          trip.deliveryDetails = req.body.deliveryDetails

          let tripCreated = await tripModel.create(trip);
          await seriesModel.findOneAndUpdate({ _id: tripId._id }, { $set: { currentCount: currentCount } });
          
          tripIds.push(tripCreated._id);
          
        };

        let orders = await tripModel.find({ _id: { $in: tripIds } })
                    .populate('deliveryExecutiveId transporterId')
                    .populate({ path: 'vehicleId', populate: { path: 'rateCategoryId' } })
                    .populate({ path: 'salesOrderTripIds', populate: { path: 'salesOrderId invoice_db_id'  } })
                    .lean();

        for (let order of orders) {

          for (let so of order.salesOrderTripIds) {
                
                let orderObj = {};

                // let weight = _.find(order.invoice_db_id, { so_db_id: so._id });
                
                let weight = _.sumBy(order.invoice_db_id, 'totalWeight');

                let DeliveryDate = new Date(so.salesOrderId.deliveryDate);
                DeliveryDate = DeliveryDate.toISOString().split('T')[0];

                let startOfTheDay = (DeliveryDate + " 00 00 00").toString();
                let endOfTheDay = (DeliveryDate + " 23 59 00").toString();
                
                orderObj = {
                    customerName: so.salesOrderId.customerName,
                    customerCode: so.salesOrderId.customerCode,
                    latitude: so.salesOrderId.latitude,
                    longitude: so.salesOrderId.longitude,
                    deliveryTimeStart: startOfTheDay,
                    deliveryTimeEnd: endOfTheDay,
                    orderWeight: weight
                };

                orderArray.push(orderObj);
            };
        };

        for (let v of orders) {

              let vehicleObj = {}, cost = 0;

              /*

                If Rate Type Type Monthly ,
                Total Cost =Fixed Rental + { Total Distance across all trip sheets in a month - Total Included Distance } * Cost per additional Km. 
                If Total Distance across all trip sheets in a month - Total Included Distance is negative , kindly take Zero. 

                If the Rate type is Daily ;

                Cost = (Fixed Rental)+ { Total Distance across all trip sheets in day - (Total Included Distance)} *Cost per additional Km. 

                If the Value (Total Included Distance * No of Days in month vehicles used by that specific transporter) is Negative , take as zero.

              */

              if (v.vehicleId.rateCategoryId && v.vehicleId.rateCategoryId.rateCategoryDetails) {
                
                let rentalAmount = v.vehicleId.rateCategoryId.rateCategoryDetails.fixedRentalAmount || 0;
                let additionalAmount = v.vehicleId.rateCategoryId.rateCategoryDetails.additionalAmount || 0;
                
                if (v.vehicleId && v.vehicleId.rateCategoryId) {

                  if (v.vehicleId.rateCategoryId.rateCategoryDetails.rateCategoryType === 'Monthly') {
                    cost = rentalAmount + (0 * additionalAmount) // Replace 0 with extra distance  
                  };

                  if (v.vehicleId.rateCategoryId.rateCategoryDetails.rateCategoryType === 'Daily') {
                    cost = rentalAmount + (0 * additionalAmount) // Replace 0 with extra distance
                  };

                };

              };

              vehicleObj = {
                  vehicleId: v.vehicleId._id,
                  name:  v.vehicleModel,
                  class: v.vehicleType,
                  capacity: v.tonnage,
                  cost:  cost
              };

              vehicleArray.push(vehicleObj);
        };

        return this.success(req, res, this.status.HTTP_OK, {
          orderArray, vehicleArray, tripIds
        });
          
          
        return

            //   let trip = {}, transporterDetails = req.body.transporterDetails, orderArray = [], vehicleArray = [], trip_ids=[];

            //   for ( let v of transporterDetails ) {

            //     req.body.tripId = await tripModel.countDocuments() + 1; // Mandatory to create sequence incremental unique Id
            //     if (!req.body.tripId) return false;
                
            //     req.body.transporterDetails = v
            
            //     trip = await tripModel.create(req.body);
            //     trip_ids.push(trip._id);
            
            //   let orders = await tripModel.findOne({ _id: trip._id })
            //                      .populate('vehicleId rateCategoryId checkedInId salesOrderId deliveryExecutiveId invoice_db_id')
            //                      .populate({ path: 'vehicleId', populate: {path: 'rateCategoryId'} })
            //                      .lean();

            //   for (let so of orders.salesOrderId) {
                  
            //       let orderObj = {};
            //       let weight = _.find(orders.invoice_db_id, { so_db_id: so._id });
                  
            //       so.totalWeight = weight.totalWeight;
            //       let DeliveryDate = new Date(so.deliveryDate);
            //       DeliveryDate = DeliveryDate.toISOString().split('T')[0];

            //       let startOfTheDay = (DeliveryDate + " 00 00 00").toString();
            //       let endOfTheDay = (DeliveryDate + " 23 59 00").toString();
                  
            //       orderObj = {
            //           customerName: so.customerName,
            //           customerCode: so.customerCode,
            //           latitude: so.latitude,
            //           longitude: so.longitude,
            //           deliveryTimeStart: startOfTheDay,
            //           deliveryTimeEnd: endOfTheDay,
            //           orderWeight: so.totalWeight
            //       };

            //       orderArray.push(orderObj);
            //   };

            //   for (let v of orders.vehicleId) {
            //       let vehicleObj = {}; 
            //       let transport = _.find(orders.transporterDetails, { vehicleId: v._id });
            //       let cost = 0;

            //       /*
            //         If Rate Type Type Monthly ,
            //         Total Cost =Fixed Rental + { Total Distance across all trip sheets in a month - Total Included Distance } * Cost per additional Km. 
            //         If Total Distance across all trip sheets in a month - Total Included Distance is negative , kindly take Zero. 

            //         If the Rate type is Daily ;

            //         Cost = (Fixed Rental)+ { Total Distance across all trip sheets in day - (Total Included Distance)} *Cost per additional Km. 

            //         If the Value (Total Included Distance * No of Days in month vehicles used by that specific transporter) is Negative , take as zero.

            //       */
            //       if (v.rateCategoryId && v.rateCategoryId.rateCategoryDetails) {
                    
            //         let rentalAmount = v.rateCategoryId.rateCategoryDetails.fixedRentalAmount || 0;
            //         let additionalAmount = v.rateCategoryId.rateCategoryDetails.additionalAmount || 0;

            //         if (v.rateCategoryId.rateCategoryDetails.rateCategoryType === 'Monthly') {
            //           cost = rentalAmount + (0 * additionalAmount) // Replace 0 with extra distance  
            //         };

            //         if (v.rateCategoryId.rateCategoryDetails.rateCategoryType === 'Daily') {
            //           cost = rentalAmount + (0 * additionalAmount) // Replace 0 with extra distance
            //         };

            //       };

            //       vehicleObj = {
            //           vehicleId: transport ? transport.vehicleId : '',
            //           name:  v.vehicleModel,
            //           class: v.vehicleType,
            //           capacity: v.tonnage,
            //           cost:  cost
            //       };

            //       vehicleArray.push(vehicleObj);
            //   };

            // };

            //   for (let v of req.body.checkedInId ) {
            //     await vehicleCheckedInModel.findOneAndUpdate({ _id: v }, { $set: { inTrip: 1 } } ); 
            //   };

            //   for (let v of transporterDetails) {
            //     await deliveryExecModel.findOneAndUpdate({ _id: v.deliveryExecutiveId }, { $set: { inTrip: 1 } }); 
            //   };
              
            //   return this.success(req, res, this.status.HTTP_OK, {trip_ids, orderArray, vehicleArray}, 'Trip Created !');    
          
          } catch (error) {
          console.log(error)
          this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, error));
      }
    };
};

module.exports = new MyTrip();

