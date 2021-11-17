const BaseController = require("../../baseController");
const { error, info } = require("../../../utils").logging;
const BasicCtrl = require("../../basic_config/basic_config.controller");
const AppImageCtrl = require("./../../file_handler/images/images.controller");
const moment = require("moment");
// const SalesOrderModel = require('../../sales_order/sales_order/models/sales_order.model')
const invoiceMasterModel = require("../../picker_app/invoice_master/models/invoice_master.model");
// const tripStageModel = require('./model/tripstages.model')
// const vehicleCheckedInModel = require('../../vehicle/vehicle_attendance/models/vehicle_attendance.model');
// const vehicleMasterModel = require('../../vehicle/vehicle_master/models/vehicle_master.model');
// const deliveryExecModel = require('../../employee/delivery_executive/models/delivery_executive.model');
const tripModel = require("../../MyTrip/assign_trip/model/trip.model");
const salesOrderModel = require("../../sales_order/sales_order/models/sales_order.model");
const spotSalesModel = require("../../MyTrip/assign_trip/model/spotsales.model");
const tripSalesOrders = require("../../MyTrip/assign_trip/model/salesOrder.model");
const disputeModel = require("../../MyTrip/assign_trip/model/disputes.model");
const requestHttp = require("request");
var async = require("async");
import { type } from "ramda";
import { v4 as uuidv4 } from "uuid";
import securityGenerateMonthDaysAndOtherMetaData from "../../../hooks/app/securityGenerateMonthDaysAndOtherMetaData";
const gpnModel = require("./model/gpn_model");
const Promise = require("bluebird");
const azureStorage = require("azure-storage");
const blobService = azureStorage.createBlobService();
const containerName = process.env.azureBlobContainerName;
const azureUrl = process.env.azureUploadUrl + containerName + "/";

// const transporterModel = require('../../transporter/transporter/models/transporter.model');
// const transVehicleModel = require('../../rate_category/ratecategory_transporter_vehicle_mapping/models/ratecategory_transporter_vehicle_mapping.model')
// const spotModel = require('./model/spotsales.model');
const _ = require("lodash");
const request = require("request-promise");
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose");
var QRCode = require("qrcode"); //QR code
const { pipeline } = require("stream");

// "pageMeta":{"skip":0,"pageSize":10,"total":96}}}

class DeliveryExecutivetrip extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.deliveryExecutive;
  }

  getTripByDeliveryExecutiveId = async (req, res, next) => {
    console.log(req.query.page);
    let pageSize = 100;
    let user = req.user, // user
      deliveryExecutiveId = user._id;
    let pageNumber = req.query.page || 1;

    let dateToday = moment(Date.now())
      .set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0,
      })
      .toDate();

    console.log("deliveryExecutiveId", deliveryExecutiveId);
    let pipeline = [
      {
        $match: {
          $and: [
            {
              deliveryExecutiveId: mongoose.Types.ObjectId(deliveryExecutiveId),
            },
            {
              createdAt: { $gte: dateToday },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "salesorders",
          let: { id: "$salesOrder" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$id"] },
              },
            },
          ],
          as: "salesorders",
        },
      },
      //   {$unwind: {path: "$salesorders", preserveNullAndEmptyArrays: false}},
      {
        $project: {
          tripId: 1,
          vehicleRegNumber: 1,
          salesorders: {
            $cond: {
              if: { $isArray: "$salesorders.orderItems" },
              then: { $size: "$salesorders.orderItems" },
              else: "NA",
            },
          },
        },
      },
      //   {
      //     $unwind: "$salesOrderId"
      // }

      //   , {
      //   $project: {
      //     _id: 0,
      //     deliveryDetails: 0,
      //     vehicleId: 0,
      //     checkedInId: 0,
      //     rateCategoryId: 0,

      //     deliveryExecutiveId: 0,
      //     invoice_db_id: 0,
      //     invoiceNo: 0,
      //     approvedBySecurityGuard: 0,
      //     isTripStarted: 0,
      //     isActive: 0,
      //     tripFinished: 0,
      //     isCompleteDeleiveryDone: 0,
      //     isPartialDeliveryDone: 0,
      //     returnedStockDetails: 0,
      //     __v: 0,

      //   }
      // },

      {
        $skip: pageSize * (pageNumber - 1),
      },
      {
        $limit: 100,
      },
      // {
      //   $group: {
      //     _id: '$_id',
      //     totalSales:{$sum:1},
      //     orders:{
      //       $push: '$$ROOT'
      //     }
      //     // 'attendanceLog': { $push: '$attendanceLog' },
      //     // 'userId': { $push: '$userId' }
      //   }
      // },

      {
        $group: {
          _id: "$deliveryExecutiveId",
          total: { $sum: 1 },
          tripData: {
            $push: "$$ROOT",
          },
          // 'attendanceLog': { $push: '$attendanceLog' },
          // 'userId': { $push: '$userId' }
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];

    let trip = await tripModel.aggregate(pipeline);

    //   let totalCrateCount = db.collection.aggregate([

    //     // Unwind the first array
    //     { "$unwind": "$clicks" },

    //     // Sum results and keep the other array per document
    //     { "$group": {
    //         "_id": "$_id",
    //         "total_clicks": { "$sum": "$clicks.clicks" }
    //         "impressions": { "$first": "$impressions" }
    //     }},

    //     // Unwind the second array
    //     { "$unwind": "$impressions" },

    //     // Group the final result keeping the first result
    //     { "$group": {
    //         "_id": "$_id",
    //         "total_clicks": { "$first": "$total_clicks" },
    //         "total_impressions": { "$sum": "$impressions.impressions" }
    //     }}

    // ])

    let totalCount = await tripModel.count({
      $and: [
        {
          deliveryExecutiveId: deliveryExecutiveId,
        },
        {
          createdAt: { $gte: dateToday },
        },
      ],
    });
    let data = {
      results: trip,
      pageMeta: {
        skip: pageSize * (pageNumber - 1),
        pageSize: pageSize,
        total: totalCount,
      },
    };

    try {
      info("getting delivery executive trip data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.deliveryExecutiveTriplistFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }

    // success(req, res, status, data = null, message = 'success')
  };
  // Trip detail by tripID
  getTripByTripId = async (req, res, next) => {
    let user = req.user, // user
      deliveryExecutiveId = user._id;
    let ID = parseInt(req.params.tripid);
    let pipeline = [];
    let type = req.params.type;
    let pageSize = 100;
    let pageNumber = req.query.page;
    info("getting trip data!");
    if (type === "salesorders" || type === "salesOrder") {
      pipeline = [
        {
          $match: {
            $and: [
              {
                deliveryExecutiveId:
                  mongoose.Types.ObjectId(deliveryExecutiveId),
              },
              {
                tripId: ID,
              },
            ],
          },
        },
        {
          $lookup: {
            from: "tripSalesOrders",
            localField: "salesOrderTripIds",
            foreignField: "_id",
            as: "salesOrder",
          },
        },
        {
          $lookup: {
            from: "salesorders",
            localField: "salesOrder.salesOrderId",
            foreignField: "_id",
            as: "salesOrder.details",
          },
        },
        {
          $group: {
            _id: "$salesOrder.details.customerPhone",
            totalCrate: { $sum: "salesOrder.crateIn" },
            totalSalesOrder: { $sum: 1 },

            orderData: {
              $push: "$$ROOT",
            },
          },
        },
        // {
        //   $lookup:{
        //     from:'spotSales',
        //     localField:'spotSalesId',
        //     foreignField:'_id',
        //     as:'spotSales'
        //   }
        // },
        {
          $project: {
            spotSalesId: 0,
          },
        },
        // {
        //   $group: {
        //     _id: '$spotSalesId',
        //     totalSalesOrder:{$sum:1},
        //     spotSales: {
        //       $push: '$$ROOT'
        //     }

        //   }
        // },

        {
          $skip: pageSize * (pageNumber - 1),
        },
        {
          $limit: 100,
        },
      ];
    } else if (type === "spotsales" || type === "spotSales") {
      pipeline = [
        {
          $match: {
            $and: [
              {
                deliveryExecutiveId: deliveryExecutiveId,
              },
              {
                tripId: ID,
              },
            ],
          },
        },
        //   {
        //   $lookup:{
        //     from:'salesorders',
        //     localField:'salesOrderId',
        //     foreignField:'_id',
        //     as:'salesOrder'
        //   }
        // },
        // {
        //   $group: {
        //     _id: '$salesOrderId',
        //     totalSalesOrder:{$sum:1},
        //     salesData: {
        //       $push: '$$ROOT'
        //     }

        //   }
        // },
        {
          $lookup: {
            from: "spotSales",
            localField: "spotSalesId",
            foreignField: "_id",
            as: "spotSales",
          },
        },
        {
          $project: {
            _id: 0,
            salesOrderId: 0,
          },
        },
        // {
        //   $group: {
        //     _id: '$spotSalesId',
        //     totalSalesOrder:{$sum:1},
        //     spotSales: {
        //       $push: '$$ROOT'
        //     }

        //   }
        // },

        {
          $skip: pageSize * (pageNumber - 1),
        },
        {
          $limit: 100,
        },
      ];
    }
    let trip = await tripModel.aggregate(pipeline);
    // find().populate('spotSalesId vehicleId salesOrderId');

    let totalCount = await tripModel.count({
      $and: [
        {
          deliveryExecutiveId: deliveryExecutiveId,
        },
        {
          tripId: ID,
        },
      ],
    });
    let data = {
      results: trip,
      pageMeta: {
        skip: pageSize * (pageNumber - 1),
        pageSize: pageSize,
        total: totalCount,
      },
    };

    try {
      info("getting delivery executive trip data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.deliveryExecutiveTripDetailsFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }

    // success(req, res, status, data = null, message = 'success')
  };

  getOrderByCustomer = async (req, res, next) => {
    let user = req.user, // user
      deliveryExecutiveId = user._id;
    let ID = parseInt(req.params.orderId);
    let phNo = req.params.phoneNumber;
    let pipeline = [];
    let type = req.params.type;
    let pageSize = 100;
    let pageNumber = req.query.page;

    let customerSalesOrderData = await tripSalesOrders
      .find({ _id: mongoose.Types.ObjectId(ID) })
      .populate({
        path: "salesOrderId",
        match: { customerPhone: phNo },
        options: {
          limit: pageSize,
          sort: { created: -1 },
          skip: pageNumber * pageSize,
        },
      });

    try {
      info("getting salesorder data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        customerSalesOrderData || [],
        this.messageTypes.deliveryExecutiveTripDetailsFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  getOrderDetails = async (req, res, next) => {
    let model;
    let pageSize = 100;
    let pageNumber = req.query.page;
    switch (req.params.type) {
      case "salesorders":
        model = salesOrderModel;
        break;
      case "spotsales":
        model = spotSalesModel;

        break;
      case "assettransfer":
        model = require("../../MyTrip/assign_trip/model/spotsales.model");
        break;
      default:
        model = null;
        break;
    }

    let pipeline = [
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.orderid),
        },
      },
      {
        $skip: pageSize * (pageNumber - 1),
      },
      {
        $limit: 100,
      },
    ];

    let orderData = await model.aggregate(pipeline);

    try {
      info("getting order data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        orderData || [],
        this.messageTypes.deliveryExecutiveOrderDetailsFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  updateOrderStatus = async (req, res, next) => {
    let Model;
    let pageSize = 100;
    let pageNumber = req.query.page;
    let dataObj = req.body;
    let user = req.user, // user
      deliveryId = user._id;

    switch (req.params.type) {
      case "salesorders":
        Model = salesOrderModel;
        break;
      case "spotsales":
        Model = spotSalesModel;

        break;
      case "assettransfer":
        mMdel = require("../../MyTrip/assign_trip/model/spotsales.model");
        break;
      default:
        Model = null;
        break;
    }
    console.log(Model);
    // let suppliedQty = req.body.data[0].supplied_qty;
    // let itemRemarks = req.body.data[0].item_remarks;
    // let caret_count = req.body.data[0].caret_count;
    // let isVerified = req.body.data[0].isverified;
    // let string_ = suppliedQty+' '+itemRemarks+' '+caret_count+' '+isVerified;
    if (!_.isEmpty(dataObj)) {
      // creating the push object
      let updateObject = {
        //'orderItems.$.suppliedQty': dataObj.supplied_qty,
        itemRemarks: dataObj.itemRemarks[0],
        caretCount: dataObj.caretCount,
        itemId: dataObj.itemId,
      };

      console.log("updateObj", updateObject);

      let quantity = await invoiceMasterModel.aggregate([
        {
          $match: {
            "itemSupplied._id": mongoose.Types.ObjectId(req.params.itemid),
          },
        },
        {
          $project: {
            _id: 0,
            totalQuantity: "$itemSupplied.quantity",
            orderedQuantity: "$itemSupplied.requiredQuantity",
          },
        },
      ]);

      // console.log("quantity",quantity[0].totalQuantity, quantity[0].orderedQuantity)
      //  let updatedOrderDetail = []
      // if(quantity[0].totalQuantity[0] < quantity[0].orderedQuantity[0]) {
      // updating the last login details
      let updatedOrderDetail = await Model.updateOne(
        {
          "orderItems._id": mongoose.Types.ObjectId(req.params.itemId),
          orderItems: { $elemMatch: { material_no: dataObj.itemId } },
        },
        { $push: { "orderItems.$.itemRemarks": dataObj.itemRemarks[0] } }
      );
      // }
      // console.log(updatedOrderDetail)
      try {
        info("updating order!");

        // success response
        this.success(
          req,
          res,
          this.status.HTTP_OK,
          updatedOrderDetail,
          this.messageTypes.deliveryExecutiveOrderUpdatedSuccessfully
        );

        // catch any runtime error
      } catch (err) {
        error(err);
        this.errors(
          req,
          res,
          this.status.HTTP_INTERNAL_SERVER_ERROR,
          this.exceptions.internalServerErr(req, err)
        );
      }
    }
  };

  generateGpnNumber = async (req, res, next) => {
    let user = req.user, // user
      deliveryExecutiveId = user._id;
    let tripId = req.body.tripid || req.body.tripId;
    let invoiceId = req.body.invoiceid || req.body.invoiceId;
    let invoiceNumber = req.body.invoiceNumber || req.body.invoicenumber;
    let salesOrderId = req.body.salesOrderId || req.body.salesorderid;
    let orderType = req.params.type,
      spotSalesId = req.body.spotSalesId || req.body.spotsalesid;
    let crateIn = req.body.cratein || req.body.crateIn || 0;
    let pageSize = 100,
      pageNumber = req.query.page || 1;

    let isVerify = parseInt(req.query.verify) ? parseInt(req.query.verify) : 0;
    // sales order update caret

    let updatedOrderDetail = await salesOrderModel.update(
      {
        _id: mongoose.Types.ObjectId(salesOrderId),
      },
      {
        $inc: {
          crateIn: crateIn,
        },
      }
    );

    //  sales order update end

    info("getting trip data!");
    let pipeline = [
      {
        $match: {
          so_db_id: mongoose.Types.ObjectId(invoiceId),
        },
      },
      {
        $lookup: {
          from: "salesorders",
          localField: "so_db_id",
          foreignField: "_id",
          as: "salesOrder",
        },
      },
      // {
      //   $group: {
      //     _id: '$salesOrderId',
      //     totalSalesOrder:{$sum:1},
      //     salesData: {
      //       $push: '$$ROOT'
      //     }

      //   }
      // },

      {
        $project: {
          _id: 0,
        },
      },
      // {
      //   $group: {
      //     _id: '$spotSalesId',
      //     totalSalesOrder:{$sum:1},
      //     spotSales: {
      //       $push: '$$ROOT'
      //     }

      //   }
      // },
    ];
    let invoiceData = await invoiceMasterModel.aggregate(pipeline);
    // find().populate('spotSalesId vehicleId salesOrderId');

    try {
      info("generating GPN!");

      //  DE ID,Invoice ID,Trip ID,SO ID,invoice_no
      let objToEncode = {
        deliverExecutiveId: deliveryExecutiveId,
        invoiceId: [mongoose.Types.ObjectId(invoiceId)],
        tripId: mongoose.Types.ObjectId(tripId),
        salesOrderId: [mongoose.Types.ObjectId(salesOrderId)],
        orderType: orderType,

        spotSalesId: [mongoose.Types.ObjectId(spotSalesId)],
        invoiceNumber: [invoiceNumber],
        gpn: uuidv4(),
        // 'sales_order_no':['SO-123'],
        order_date: "20/02/2021",
        // 'spotSalesId':'5ff4161a56742a7178ed445d',
        isVerify: isVerify,
        isDeleted: 0,
        crateCount: parseInt(crateIn),
      };

      let gpnData = await gpnModel.generateGpn(objToEncode);

      let qr = await QRCode.toDataURL(JSON.stringify(gpnData), {
        type: "terminal",
      }); //Generate Base64 encode QR code String
      let responseObj = {
        invoiceNumber: invoiceNumber,
        //'invoiceId': invoiceId,
        //'qr': qr,
        gpn: gpnData.gpn,
      };

      // invoiceData[0]['qr']=Buffer.from(qr).toString('base64');
      // invoiceData[0]['qr'] = qr;
      // invoiceData[0]['isverify'] = isVerify||0;

      // console.log(qr);

      this.success(
        req,
        res,
        this.status.HTTP_OK,
        responseObj || [],
        this.messageTypes.deliveryExecutiveGPNGeneratedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  getInvoiceByNumber = async (req, res, next) => {
    let user = req.user, // user
      deliveryExecutiveId = user._id;
    let invoiceId = req.query.invoiceid;
    let invoiceNo = req.query.invoiceno || 0;

    let pipeline = [
      {
        $match: {
          $or: [
            // {'_id':mongoose.Types.ObjectId(invoiceId)},
            { "invoiceDetails.invoiceNo": invoiceNo },
          ],
        },
      },
      {
        $lookup: {
          from: "salesorders",
          let: { id: "$so_db_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$id"] },
              },
            },
          ],
          as: "salesorders",
        },
      },
      { $unwind: { path: "$salesorders" } },
      { $unwind: { path: "$salesorders.orderItems" } },
      {
        $group: {
          _id: "$invoiceDetails.invoiceNo",
          so_db_id: { $first: "$so_db_id" },
          orderPlacedAt: { $first: "$createdAt" },
          invoiceNo: { $first: "$invoiceDetails.invoiceNo" },
          item: {
            $push: {
              Id: "$salesorders.orderItems._id",
              itemId: "$salesorders.orderItems.material_no",
              suppliedQty: "$salesorders.orderItems.suppliedQty",
              quantity: "$salesorders.orderItems.quantity",
              itemName: "$salesorders.orderItems.material_description",
              itemRemarks: "$salesorders.orderItems.itemRemarks",
            },
          },
        },
      },
      // {
      //   $project: {so_db_id: 1, "orderPlacedAt": "$createdAt", "invoiceNo": "$invoiceDetails.invoiceNo", "item.Id": "$salesorders.orderItems._id", "item.itemId": "$salesorders.orderItems.material_no",
      //     "item.suppliedQty": "$salesorders.orderItems.suppliedQty", "item.quantity": "$salesorders.orderItems.quantity",
      //      "item.itemName": "$salesorders.orderItems.material_description","item.itemRemarks": "$salesorders.orderItems.itemRemarks",
      //   }},
      // {
      //   $project: {
      //     so_db_id: 1, "orderPlacedAt": "$createdAt", "invoiceNo": "$invoiceDetails.invoiceNo", "itemSupplied.itemId": 1, "itemSupplied.suppliedQty": 1, "itemSupplied.quantity": 1,
      //     "itemSupplied.itemName": 1, "itemRemarks":"$salesorders.itemRemarks"
      //   }
      // }

      {
        $lookup: {
          from: "spotSales",
          localField: "spotSalesId",
          foreignField: "_id",
          as: "spotSales",
        },
      },
    ];
    let invoiceDetail = await invoiceMasterModel.aggregate(pipeline);

    try {
      info("Getting invoice Detail!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        invoiceDetail || [],
        this.messageTypes.deliveryExecutiveInvoiceFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  // CHeck the reponse and add proper key and vehicle details
  updateOdometerReading = async (req, res, next) => {
    let ID = parseInt(req.params.tripid);
    let user = req.user; // user
    let pageSize = 100;

    let deliveryExecutiveId = user._id;

    let pageNumber = req.query.page || 1;

    let updateObject = {
      initialOdometerReading: parseInt(req.body.odometerreading),
      isTripStarted: 1,
      isActive: 1,
    };

    let odometerReading = await tripModel.findOneAndUpdate(
      {
        tripId: ID,
      },
      {
        $set: updateObject,
      },
      {
        new: true,
      }
    );

    const now = new Date();
    let dateToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let pipeline = [
      {
        $match: {
          $and: [
            {
              deliveryExecutiveId: deliveryExecutiveId,
            },
            {
              createdAt: { $gte: dateToday },
            },
          ],
        },
      },
      //   {
      //     $unwind: "$salesOrderId"
      // }

      {
        $project: {
          _id: 0,
          deliveryDetails: 0,
          vehicleId: 0,
          checkedInId: 0,
          rateCategoryId: 0,

          deliveryExecutiveId: 0,
          invoice_db_id: 0,
          invoiceNo: 0,
          approvedBySecurityGuard: 0,
          isTripStarted: 0,
          isActive: 0,
          tripFinished: 0,
          isCompleteDeleiveryDone: 0,
          isPartialDeliveryDone: 0,
          returnedStockDetails: 0,

          __v: 0,
        },
      },
      {
        $skip: pageSize * (pageNumber - 1),
      },
      {
        $limit: 100,
      },
      // {
      //   $group: {
      //     _id: '$_id',
      //     totalSales:{$sum:1},
      //     orders:{
      //       $push: '$$ROOT'
      //     }
      //     // 'attendanceLog': { $push: '$attendanceLog' },
      //     // 'userId': { $push: '$userId' }
      //   }
      // },

      {
        $group: {
          _id: "$deliveryExecutiveId",
          total: { $sum: 1 },
          tripData: {
            $push: "$$ROOT",
          },
          // 'attendanceLog': { $push: '$attendanceLog' },
          // 'userId': { $push: '$userId' }
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    let trip = await tripModel.aggregate(pipeline);

    try {
      info("Getting trip Detail!");

      // odometerReading
      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        trip || [],
        this.messageTypes.deliveryExecutiveOdometerReadingUpdatedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  // Changes required and check the response
  getInTrip = async (req, res, next) => {
    info("getting in trip data!");
    let user = req.user, // user
      deliveryExecutiveId = user._id,
      type = req.params.type;
    let pipeline = [
      {
        $match: {
          $and: [
            {
              deliveryExecutiveId: mongoose.Types.ObjectId(deliveryExecutiveId),
            },
            {
              isActive: 1,
            },
          ],
        },
      },
    ];
    if (type === "salesorders" || type === "salesOrders") {
      pipeline.push(
        ...[
          { $project: { tripId: 1, salesOrder: 1, vehicleRegNumber: 1 } },
          { $unwind: { path: "$salesOrder" } },
          {
            $lookup: {
              from: "salesorders",
              let: { id: "$salesOrder" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$id"] },
                  },
                },
              ],
              as: "salesorders",
            },
          },
          {
            $unwind: {
              path: "$salesorders",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: "invoicemasters",
              let: { id: "$salesOrder" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$so_db_id", "$$id"] },
                  },
                },
              ],
              as: "invoice",
            },
          },
          { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              tripId: 1,
              salesOrder: 1,
              vehicleRegNumber: 1,
              getDirection: "$salesorders.location",
              NoOfCrates: "$salesorders.crateIn",
              sold_to_party_description:
                "$salesorders.sold_to_party_description",
              sold_to_party: "$salesorders.sold_to_party",
              address1: "$invoice.shippingDetails.address1",
              mobileNo: "$invoice.shippingDetails.mobileNo",
              cityId: "$invoice.shippingDetails.cityId",
              isDelivered: "$invoice.isDelivered",
              salesorders: {
                $cond: {
                  if: { $isArray: "$salesorders.item" },
                  then: { $size: "$salesorders.item" },
                  else: "NA",
                },
              },
            },
          },
          //   {
          //     $lookup:{
          //       from:'trips',
          //       localField:'salesOrder',
          //       foreignField:'_id',
          //       as:'order'

          //     }
          //   },  {
          //     $lookup:{
          //       from:'salesorders',
          //       localField:'order.salesOrderId',
          //       foreignField:'_id',
          //       as:'order.details'

          //     }
          //   }
          //   ,{
          //   $lookup:{
          //     from:'vehiclemasters',
          //     localField:'vehicleId',
          //     foreignField:'_id',
          //     as:'vehicleDetail'
          //   }
          // },
          {
            $group: {
              _id: "$order.details.customerName",
              orderData: {
                $push: "$$ROOT",
              },
              totalCrate: { $sum: "crateIn" },
            },
          },
        ]
      );

      // {
      //   $lookup:{
      //     from:'salesorders',
      //     localField:'salesOrderId',
      //     foreignField:'_id',
      //     as:'salesOrder'

      //   }
      // },{
      //   $project:{
      //     spotSalesId:0
      //   }

      // }
    }
    if (type === "spotsales" || type === "spotSales") {
      pipeline.push(
        ...[
          {
            $lookup: {
              from: "spotSales",
              localField: "spotSalesId",
              foreignField: "_id",
              as: "spotSales",
            },
          },
          {
            $lookup: {
              from: "vehiclemasters",
              localField: "vehicleId",
              foreignField: "_id",
              as: "vehicleDetail",
            },
          },
          {
            $group: {
              _id: "salesManName",
            },
          },
          {
            $project: {
              salesOrderId: 1,
            },
          },
        ]
      );
    }

    //   let activeTripData = await tripModel.find({$and:[{'transporterDetails.deliveryExecutiveId':mongoose.Types.ObjectId(deliveryExecutiveId)},
    //   {
    //     'isActive':1
    //   }
    // ]
    // }).populate('spotSalesId vehicleId salesOrderId');

    let activeTripData = await tripModel.aggregate(pipeline);

    // console.log('totalCrateCount',data)

    try {
      info("Getting trip Detail!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        activeTripData || [],
        this.messageTypes.deliveryExecutiveInTripDataFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  getInTripInvoicelist = async (req, res, next) => {
    try {
      info("getting the intrip invoice numbers by sales orders");

      let so_id = req.params.salesorderId;

      let invoiceNumber = await invoiceMasterModel.aggregate([
        { $match: { so_db_id: mongoose.Types.ObjectId(so_id) } },
        {
          $project: {
            customerName: 1,
            invoice: "$invoiceDetails.invoiceNo",
            salesOrderNo: "$soId",
            "shippingDetails.address1": 1,
            "shippingDetails.cityId": 1,
            orderPlacedAt: "$createdAt",
          },
        },
      ]);
      //on success
      if (invoiceNumber && !_.isEmpty(invoiceNumber)) {
        this.success(
          req,
          res,
          this.status.HTTP_OK,
          invoiceData,

          this.messageTypes.InoiceNumberBySoIdFetchedSuccessfully
        );
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.InoiceNumberBySoIdNotFetchedSuccessfully
        );
      }
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  getInvoiceVew = async (req, res, next) => {
    let user = req.user, // user
      deliveryExecutiveId = user._id;
    let invoiceId = req.query.invoiceid;
    let invoiceNo = req.query.invoiceno || 0;

    let pipeline = [
      {
        $match: {
          $or: [{ "invoiceDetails.invoiceNo": invoiceNo }],
        },
      },
      {
        $lookup: {
          from: "invoicemasters",
          let: { id: "$salesOrder" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$so_db_id", "$$id"] },
              },
            },
          ],
          as: "invoice",
        },
      },
      {
        $project: {
          so_db_id: 1,
          isDelivered: 1,
          orderPlacedAt: "$createdAt",
          invoiceNo: "$invoiceDetails.invoiceNo",
          "itemSupplied.itemId": 1,
          "itemSupplied._id": 1,
          "itemSupplied.suppliedQty": 1,
          "itemSupplied.quantity": 1,
          "itemSupplied.itemName": 1,
        },
      },

      // {
      //   $lookup:{
      //     from:'spotSales',
      //     localField:'spotSalesId',
      //     foreignField:'_id',
      //     as:'spotSales'
      //   }
      // },
    ];
    let invoiceDetail = await invoiceMasterModel.aggregate(pipeline);

    try {
      info("Getting invoice Detail!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        invoiceDetail || [],
        this.messageTypes.deliveryExecutiveInvoiceFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  // delivery EXecutive history
  // Changes required
  getHistoryByOrderType = async (req, res, next) => {
    let user = req.user, // user
      type = req.params.type,
      deliveryExecutiveId = user._id,
      pageNumber = parseInt(req.query.page) || 1,
      pageSize = 10;
    let dateToday = moment(Date.now())
      .set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0,
      })
      .toDate();

    let pipeline = [
      {
        $match: {
          $and: [
            {
              deliveryExecutiveId: mongoose.Types.ObjectId(deliveryExecutiveId),
            },
            {
              isActive: 0,
            },
            {
              createdAt: { $lt: dateToday },
            },
          ],
        },
      },
    ];
    if (type === "salesorders" || type === "salesOrder") {
      pipeline.push(
        ...[
          {
            $project: { vehicleRegNumber: 1, tripId: 1, salesOrder: 1, _id: 0 },
          },
          {
            $lookup: {
              from: "salesorders",
              let: { id: "$salesOrder" },
              pipeline: [
                {
                  $match: { $expr: { $eq: ["$_id", "$$id"] } },
                },
                {
                  $lookup: {
                    from: "invoicemasters",
                    let: { id: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ["$so_db_id", "$$id"] },
                        },
                      },
                    ],
                    as: "invoices",
                  },
                },
              ],
              as: "salesorder",
            },
          },
          {
            $unwind: { path: "$salesorder", preserveNullAndEmptyArrays: false },
          },
          {
            $unwind: {
              path: "$salesorder.invoices",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $group: {
              _id: "$tripId",
              vehicleRegNumber: { $first: "$vehicleRegNumber" },
              isDelivered: { $first: "$salesorder.invoices.isDelivered" },
              so_db_id: { $first: "$salesOrder" },
              customerName: { $first: "$salesorder.sold_to_party_description" },
              address: {
                $first: "$salesorder.invoices.shippingDetails.address1",
              },
              city: { $first: "$salesorder.invoices.shippingDetails.cityId" },
              noOfCrates: { $first: "$salesorder.crateIn" },
              customerCode: { $first: "$salesorder.sold_to_party" },
              mobileNo: {
                $first: "$salesorder.invoices.shippingDetails.mobileNo",
              },
              saleOrders: { $sum: 1 },
            },
          },
          // {
          //   $lookup:{
          //     from:'salesorders',
          //     localField:'salesOrder',
          //     foreignField:'_id',
          //     as:'salesOrder'

          //   }
          // },{
          //   $project:{
          //     tripId:1,
          //     salesOrder:1,
          //     transporterDetails:1,
          //     totalCrate: { $sum: ["$salesOrder.crateIn"] }
          //   },

          // },
          {
            $skip: pageSize * (pageNumber - 1),
          },
          {
            $limit: pageNumber,
          },
        ]
      );
    }

    if (type === "spotsales" || type === "spotSales") {
      pipeline.push(
        ...[
          {
            $lookup: {
              from: "spotsales",
              localField: "spotsalesId",
              foreignField: "_id",
              as: "spotsales",
            },
          },
          {
            $project: {
              tripId: 1,
              salesOrder: 1,
              transporterDetails: 1,
              totalCrate: { $sum: ["$salesOrder.crateIn"] },
            },
          },
          {
            $skip: pageSize * (pageNumber - 1),
          },
          {
            $limit: pageSize,
          },
        ]
      );
    }

    //   let pipeline = [
    //     {$match:{$and:[{
    //       'transporterDetails.deliveryExecutiveId':deliveryExecutiveId
    //     },
    //     {
    //       'isCompleteDeleiveryDone':0
    //     }
    //     // {
    //     // delivery executive todays trip field
    //     // }
    //   ]
    // }
    // },
    //     {
    //     $skip:(pageSize*(pageNumber-1))
    //     },
    //     {
    //       $limit:pageNumber}
    //   ]

    let historyData = await tripModel.aggregate(pipeline);

    let totalCount = await tripModel.count({
      $and: [
        { deliveryExecutiveId: deliveryExecutiveId },
        {
          isActive: 0,
        },
        {
          $or: [
            {
              isCompleteDeleiveryDone: 1,
            },
            {
              isPartialDeliveryDone: 1,
            },
            {
              tripFinished: 1,
            },
          ],
        },
      ],
    });
    let data = {
      results: historyData,
      pageMeta: {
        skip: pageSize * (pageNumber - 1),
        pageSize: pageSize,
        total: totalCount,
      },
    };

    try {
      info("Getting History Detail!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.deliveryExecutiveHistoryDataFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  updateItemStatusAndCaretOut = async (req, res, next) => {
    try {
      let _id = req.params.id;
      let crateOut = req.body.crateOut || req.body.crateout || 0;
      let crateOutWithItem =
        req.body.crateOutWithItem || req.body.crateoutwithitem || 0;
      // let itemDeliveryStatus = req.body.itemDeliveryStatus || req.body.itemdeliverystatus  || 0;
      // let RejecteditemQuantity = req.body.rejectedQuantity || req.body.rejectedquantity  || 0;
      // let comment = req.body.rejectedQuantity || req.body.rejectedquantity  || 0;
      let orderItems = req.body.itemdata || req.body.itemData || [];
      let updatedOrderDetail;
      let caretDetailUpdated;
      // sales order update crate

      caretDetailUpdated = await salesOrderModel.updateOne(
        {
          _id: mongoose.Types.ObjectId(_id),
        },
        {
          $inc: {
            crateIn: -(crateOut + crateOutWithItem),
          },
          // 'orderItems.rejectedQuantity':RejecteditemQuantity,
          // 'orderItems.itemDeliveryStatus':itemDeliveryStatus,
          crateOut: crateOut,
          crateOutWithItem: crateOutWithItem,
        }
      );

      orderItems.forEach(async (item, index) => {
        console.log("item====>", item);
        console.log("orderItems==>", orderItems);
        let updateObj = {
          "orderItems.$.itemDeliveryStatus": item.itemdeliverystatus
            ? item.itemdeliverystatus
            : 0,
          "orderitems.$.rejectedQuantity": item.rejectedquantity
            ? item.rejectedquantity
            : 0,
          "orderItems.$.comments": item.comments ? item.comments : "",
        };
        //   console.log("updateObj",updateObj);

        // updatedOrderDetail = await salesOrderModel.updateOne(
        //   {
        //     '_id': mongoose.Types.ObjectId(_id) ,
        //     'orderItems.id':mongoose.Types.ObjectId(item.id)

        //   },
        //   {$set: {...updateObj}},

        //   // {
        //     //    $inc:
        //     //    {
        //       //       'crateIn': -((crateOut + crateOutWithItem))
        //       //     },
        //       //     // 'orderItems.rejectedQuantity':RejecteditemQuantity,
        //       //     // 'orderItems.itemDeliveryStatus':itemDeliveryStatus,
        //       //     'crateOut':crateOut,
        //       //     'crateOutWithItem':crateOutWithItem,

        //       //     // {$set: {levels.$.questions.$: upQstnObj}

        //       //     // }
        //       //   }

        //     )
        //      //  sales order update end

        //   });

        updatedOrderDetail = await salesOrderModel.updateOne(
          {
            _id: mongoose.Types.ObjectId(_id),
            orderItems: {
              $elemMatch: { _id: mongoose.Types.ObjectId(item.id) },
            },
          },
          {
            $set: {
              "orderItems.$.itemDeliveryStatus": item.itemdeliverystatus
                ? item.itemdeliverystatus
                : 0,
              "orderItems.$.rejectedQuantity": item.rejectedquantity
                ? item.rejectedquantity
                : 0,
              "orderItems.$.comments": item.comments ? item.comments : "",
            },
          }
        );

        // updatedOrderDetail = await salesOrderModel.updateOne({'_id': mongoose.Types.ObjectId(_id)},
        // {$set:{...updateObj}})
      });

      info("Delivery Status Updating!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        updatedOrderDetail || [],
        this.messageTypes.deliveryExecutiveDeliveryStatusUpdateSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  // Changes required and check the response body
  getTripHistoryByDeliveryExecutiveId = async (req, res, next) => {
    console.log(req.query.page);
    let pageSize = 100;
    let user = req.user, // user
      deliveryExecutiveId = user._id;
    let pageNumber = req.query.page;

    let dateToday = moment(Date.now())
      .set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0,
      })
      .toDate();

    let pipeline = [
      {
        $match: {
          $and: [
            {
              deliveryExecutiveId: mongoose.Types.ObjectId(deliveryExecutiveId),
            },
            {
              createdAt: { $lt: dateToday },
            },
          ],
        },
      },
      {
        $project: {
          salesOrder: 1,
          vehicleRegNumber: 1,
          tripId: 1,
          createdAt: 1,
        },
      },
      {
        $lookup: {
          from: "salesorders",
          let: { id: "$salesOrder" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$id"] },
              },
            },
          ],
          as: "salesorders",
        },
      },
      { $unwind: { path: "$salesorders", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          tripId: 1,
          vehicleRegNumber: 1,
          createdAt: 1,
          NoOfCrates: "$salesorders.crateIn",
          salesorders: {
            $cond: {
              if: { $isArray: "$salesorders.item" },
              then: { $size: "$salesorders.item" },
              else: "NA",
            },
          },
        },
      },

      {
        $skip: pageSize * (pageNumber - 1),
      },
      {
        $limit: 100,
      },
      // {
      //     _id: '$_id',
      //   $group: {
      //     totalSales:{$sum:1},
      //     orders:{
      //       $push: '$$ROOT'
      //     }
      //     // 'attendanceLog': { $push: '$attendanceLog' },
      //     // 'userId': { $push: '$userId' }
      //   }
      // },

      {
        $group: {
          _id: "$deliveryExecutiveId",
          total: { $sum: 1 },
          tripData: {
            $push: "$$ROOT",
          },
          // 'attendanceLog': { $push: '$attendanceLog' },
          // 'userId': { $push: '$userId' }
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];

    let trip = await tripModel.aggregate(pipeline);

    let totalCount = await tripModel.count({
      $and: [
        {
          deliveryExecutiveId: deliveryExecutiveId,
        },
        {
          createdAt: { $lt: dateToday },
        },
      ],
    });
    let data = {
      results: trip,
      pageMeta: {
        skip: pageSize * (pageNumber - 1),
        pageSize: pageSize,
        total: totalCount,
      },
    };

    try {
      info("getting delivery executive trip data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.deliveryExecutiveTripHistoryFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }

    // success(req, res, status, data = null, message = 'success')
  };

  getSalesOrdersbyTripID = async (req, res, next) => {
    try {
      info("getting the salesOrder by trip Id");

      let tripId = req.params.tripId;
      console.log("tripId", tripId);
      let salesOrderlist = await tripModel.aggregate([
        { $match: { tripId: parseInt(req.params.tripId) } },
        { $project: { salesOrder: 1, vehicleRegNumber: 1 } },
        { $unwind: { path: "$salesOrder" } },
        {
          $lookup: {
            from: "salesorders",
            let: { id: "$salesOrder" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$id"] },
                },
              },
            ],
            as: "salesorders",
          },
        },
        {
          $unwind: { path: "$salesorders", preserveNullAndEmptyArrays: false },
        },
        {
          $lookup: {
            from: "invoicemasters",
            let: { id: "$salesOrder" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$so_db_id", "$$id"] },
                },
              },
            ],
            as: "invoice",
          },
        },
        { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            salesOrder: 1,
            vehicleRegNumber: 1,
            sold_to_party_description: "$salesorders.sold_to_party_description",
            sold_to_party: "$salesorders.sold_to_party",
            //shippingDetails:"$invoice.shippingDetails",
            address1: "$invoice.shippingDetails.address1",
            mobileNo: "$invoice.shippingDetails.mobileNo",
            cityId: "$invoice.shippingDetails.cityId",
            salesorders: {
              $cond: {
                if: { $isArray: "$salesorders.orderItems" },
                then: { $size: "$salesorders.orderItems" },
                else: "NA",
              },
            },
          },
        },
      ]);
      console.log("salesOrderlist", salesOrderlist);
      //on success
      if (salesOrderlist && !_.isEmpty(salesOrderlist)) {
        this.success(
          req,
          res,
          this.status.HTTP_OK,
          salesOrderlist,
          this.messageTypes.SalesOrderListByTripIdFetchedSuccessfully
        );
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.SalesOrderListByTripIdNotFetchedSuccessfully
        );
      }
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  getInvoiceNumberbySo = async (req, res, next) => {
    try {
      info("getting the invoice numbers by sales orders");

      let so_id = req.params.salesorderId;

      let invoiceNumber = await invoiceMasterModel.aggregate([
        { $match: { so_db_id: mongoose.Types.ObjectId(so_id) } },
        {
          $project: {
            customerName: 1,
            invoice: "$invoiceDetails.invoiceNo",
            salesOrderNo: "$soId",
            "shippingDetails.address1": 1,
            "shippingDetails.cityId": 1,
            orderPlacedAt: "$createdAt",
          },
        },
      ]);

      let invoiceData = [];
      for (let v of invoiceNumber) {
        let gpnStatus = await gpnModel.aggregate([
          {
            $match: { $and: [{ invoiceNumber: v.invoice }, { isVerify: 1 }] },
          },
          { $set: { status: 1 } },
          { $project: { status: 1 } },
        ]);
        invoiceData.push({
          _id: v._id,
          customerName: v.customerName,
          invoice: v.invoice,
          salesOrderNo: v.salesOrderNo,
          shippingDetails: v.shippingDetails,
          orderPlacedAt: v.orderPlacedAt,
          status: gpnStatus.length ? gpnStatus[0].status : 0,
        });
      }

      // console.log("invoice====>",invoiceData);

      //on success
      if (invoiceNumber && !_.isEmpty(invoiceNumber)) {
        this.success(
          req,
          res,
          this.status.HTTP_OK,
          invoiceData,

          this.messageTypes.InoiceNumberBySoIdFetchedSuccessfully
        );
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.InoiceNumberBySoIdNotFetchedSuccessfully
        );
      }
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  getPendingTrip = async (req, res, next) => {
    info("getting delivery executive pending trip data!");
    let user = req.user, // user
      type = req.params.type,
      deliveryExecutiveId = user._id,
      pageNumber = parseInt(req.query.page) || 1,
      pageSize = 10;
    let dateToday = moment(Date.now())
      .set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0,
      })
      .toDate();

    let pipeline = [
      {
        $match: {
          $and: [
            {
              deliveryExecutiveId: mongoose.Types.ObjectId(deliveryExecutiveId),
            },
            {
              isActive: 0,
            },
            { createdAt: { $lt: dateToday } },
            {
              $or: [
                {
                  isTripStarted: 0,
                },
                {
                  tripFinished: 0,
                },
                {
                  isCompleteDeleiveryDone: 0,
                },
              ],
            },
          ],
        },
      },

      { $project: { tripId: 1, salesOrder: 1, vehicleRegNumber: 1 } },
      { $unwind: { path: "$salesOrder" } },
      {
        $lookup: {
          from: "salesorders",
          let: { id: "$salesOrder" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$id"] },
              },
            },
          ],
          as: "salesorders",
        },
      },
      { $unwind: { path: "$salesorders", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "invoicemasters",
          let: { id: "$salesOrder" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$so_db_id", "$$id"] },
              },
            },
          ],
          as: "invoice",
        },
      },
      { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          tripId: 1,
          salesOrder: 1,
          vehicleRegNumber: 1,
          getDirection: "$salesorders.location",
          NoOfCrates: "$salesorders.crateIn",
          sold_to_party_description: "$salesorders.sold_to_party_description",
          sold_to_party: "$salesorders.sold_to_party",
          address1: "$invoice.shippingDetails.address1",
          mobileNo: "$invoice.shippingDetails.mobileNo",
          cityId: "$invoice.shippingDetails.cityId",
          isDelivered: "$invoice.isDelivered",
          salesorders: {
            $cond: {
              if: { $isArray: "$salesorders.item" },
              then: { $size: "$salesorders.item" },
              else: "NA",
            },
          },
        },
      },
      {
        $group: {
          _id: "$tripId",
          vehicleRegNumber: { $first: "$vehicleRegNumber" },
          result: {
            $push: {
              salesOrder: "$salesOrder",
              getDirection: "$getDirection",
              NoOfCrates: "$NoOfCrates",
              sold_to_party_description: "$sold_to_party_description",
              sold_to_party: "$sold_to_party",
              address1: "$address1",
              mobileNo: "$mobileNo",
              cityId: "$cityId",
              isDelivered: "$isDelivered",
              salesorders: "$salesorders",
            },
          },
        },
      },
    ];
    let trip = await tripModel.aggregate(pipeline);

    let totalCount = await tripModel.count({
      $and: [
        { deliveryExecutiveId: deliveryExecutiveId },
        {
          isActive: 0,
        },
        { createdAt: { $lt: dateToday } },
        {
          $or: [
            {
              isTripStarted: 0,
            },
            {
              tripFinished: 0,
            },
            {
              isCompleteDeleiveryDone: 0,
            },
          ],
        },
      ],
    });
    let data = {
      trip,
      pageMeta: {
        skip: pageSize * (pageNumber - 1),
        pageSize: pageSize,
        total: trip[0].result.length,
      },
    };

    try {
      info("getting delivery executive trip data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.deliveryExecutivePendingTripFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }

    // success(req, res, status, data = null, message = 'success')
  };

  getHistoryInvoiceListbySo = async (req, res, next) => {
    try {
      info("getting the invoice numbers History by sales orders");

      let so_id = req.params.salesorderId;

      let invoiceNumber = await invoiceMasterModel.aggregate([
        { $match: { so_db_id: mongoose.Types.ObjectId(so_id) } },
        {
          $lookup: {
            from: "salesorders",
            let: { id: "$so_db_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$id"] },
                },
              },
            ],
            as: "invoice",
          },
        },
        { $unwind: { path: "$invoice" } },
        {
          $group: {
            _id: "$customerName",
            NoOfCrates: { $first: "$invoice.crateIn" },

            invoices: {
              $push: {
                invoice: "$invoiceDetails.invoiceNo",
                orderPlacedAt: "$createdAt",
                address1: "$shippingDetails.address1",
                city: "$shippingDetails.cityId",
                isDelivered: "$isDelivered",
              },
            },
            noOfSalesOrder: { $sum: 1 },
          },
        },
      ]);

      // let invoiceData = [];
      // for(let v of invoiceNumber) {
      //   await salesOrderModel.aggregate([
      //     {
      //       $match:{$and:[{invoiceNumber:v.invoice},{isVerify:1}]}},
      //       {$set: {"isDelivered":1}},{$project:{isDelivered:1}}
      //     ]);
      // invoiceData.push({
      //   "_id": v._id,
      //   "customerName": v.customerName,
      //   "invoice": v.invoice,
      //   "salesOrderNo":v.salesOrderNo,
      //   "shippingDetails":v.shippingDetails,
      //   "orderPlacedAt": v.orderPlacedAt,
      //   "isDelivered": v.isDelivered,
      // })

      //   }

      // console.log("invoice====>",invoiceData);

      //on success
      if (invoiceNumber && !_.isEmpty(invoiceNumber)) {
        this.success(
          req,
          res,
          this.status.HTTP_OK,
          invoiceNumber,

          this.messageTypes.InoiceNumberBySoIdFetchedSuccessfully
        );
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.InoiceNumberBySoIdNotFetchedSuccessfully
        );
      }
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  getPendingInvoiceListSo = async (req, res, next) => {
    try {
      info("getting undelivered invoice list by sales orders");

      let so_id = req.params.salesorderId;

      let invoiceNumber = await invoiceMasterModel.aggregate([
        { $match: { so_db_id: mongoose.Types.ObjectId(so_id) } },
        {
          $lookup: {
            from: "salesorders",
            let: { id: "$so_db_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$id"] },
                },
              },
            ],
            as: "invoice",
          },
        },
        { $unwind: { path: "$invoice" } },
        {
          $group: {
            _id: "$customerName",
            NoOfCrates: { $first: "$invoice.crateIn" },

            invoices: {
              $push: {
                invoice: "$invoiceDetails.invoiceNo",
                soId: "$soId",
                orderPlacedAt: "$createdAt",
                address1: "$shippingDetails.address1",
                city: "$shippingDetails.cityId",
                mobileNo: "$shippingDetails.mobileNo",
                isDelivered: "$isDelivered",
              },
            },
            // noOfSalesOrder: { $sum: 1 }
          },
        },
      ]);

      //on success
      if (invoiceNumber && !_.isEmpty(invoiceNumber)) {
        this.success(
          req,
          res,
          this.status.HTTP_OK,
          invoiceNumber,

          this.messageTypes.InoiceNumberBySoIdFetchedSuccessfully
        );
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.InoiceNumberBySoIdNotFetchedSuccessfully
        );
      }
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  getdispute = async (req, res, next) => {
    console.log(req.query.page);
    let pageSize = 100;
    // let user = disputeId
    let pageNumber = req.query.page;

    let dateToday = moment(Date.now())
      .set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0,
      })
      .toDate();

    let trip = await disputeModel.aggregate([
      {
        $match: {
          createdAt: { $lt: dateToday },
        },
      },
      {
        $lookup: {
          from: "invoicemasters",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoices",
        },
      },
      {
        $project: {
          disputeId: 1,
          acceptedQty: 1,
          status: 1,
          disputeDate: "$createdAt",
          invoicesNo: { $first: "$invoices.invoiceDetails.invoiceNo" },
        },
      },

      {
        $skip: pageSize * (pageNumber - 1),
      },
      {
        $limit: 100,
      },
      {
        $group: {
          _id: "$disputeId",
          total: { $sum: 1 },
          tripData: {
            $push: "$$ROOT",
          },
        },
      },
      // {
      //   $sort: {
      //     _id: -1
      //   }
      // },
    ]);

    let totalCount = await disputeModel.count({
      createdAt: { $lt: dateToday },
    });
    let data = {
      results: trip,
      pageMeta: {
        skip: pageSize * (pageNumber - 1),
        pageSize: pageSize,
        total: totalCount,
      },
    };

    try {
      info("getting desputes data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.disputeDetailsFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }

    // success(req, res, status, data = null, message = 'success')
  };

  viewDisputeDetails = async (req, res, next) => {
    console.log(req.query.page);
    let pageSize = 100;
    // let user = disputeId
    let disputeId = req.params.disputeId;
    let pageNumber = req.query.page;

    let dateToday = moment(Date.now())
      .set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0,
      })
      .toDate();

    let trip = await disputeModel.aggregate([
      { $match: { disputeId: parseInt(req.params.disputeId) } },
      {
        $lookup: {
          from: "trips",
          localField: "tripId",
          foreignField: "tripId",
          as: "trips",
        },
      },
      {
        $lookup: {
          from: "salesorders",
          localField: "salesOrderId",
          foreignField: "_id",
          as: "salesorder",
        },
      },
      { $unwind: { path: "$salesorder" } },
      {
        $lookup: {
          from: "invoicemasters",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoices",
        },
      },
      { $unwind: { path: "$salesorder.orderItems" } },
      {
        $project: {
          tripId: 1,
          status: 1,
          disputeId: 1,
          dispute_amount: 1,
          itemName: "$salesorder.orderItems.material_description",
          itemId: "$salesorder.orderItems.material_no",
          "ordered qty": "$salesorder.orderItems.quantity",
          "packed qty": "$salesorder.orderItems.suppliedQty",
          "rejected qty": "$salesorder.orderItems.rejectedQuantity",
          deliveryExecutiveName: { $first: "$trips.deliveryExecutiveName" },
          customerName: "$salesorder.sold_to_party_description",
          customerId: "$salesorder.sold_to_party",
          disputeDate: "$createdAt",
          truck_Number: { $first: "$trips.vehicleRegNumber" },
          invoicesNo: { $first: "$invoices.invoiceDetails.invoiceNo" },
        },
      },
      {
        $skip: pageSize * (pageNumber - 1),
      },
      {
        $limit: 100,
      },
      {
        $group: {
          _id: "$disputeId",
          total: { $sum: 1 },
          tripData: {
            $push: "$$ROOT",
          },
        },
      },
      // {
      //   $sort: {
      //     _id: -1
      //   }
      // },
    ]);

    let totalCount = await disputeModel.count({
      createdAt: { $lt: dateToday },
    });
    let data = {
      results: trip,
      pageMeta: {
        skip: pageSize * (pageNumber - 1),
        pageSize: pageSize,
        total: totalCount,
      },
    };

    try {
      info("getting desputes data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.disputeDetailsFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }

    // success(req, res, status, data = null, message = 'success')
  };

  getPendingViewInvoice = async (req, res, next) => {
    let user = req.user, // user
      deliveryExecutiveId = user._id;
    let invoiceId = req.query.invoiceid;
    let invoiceNo = req.query.invoiceno || 0;

    let pipeline = [
      {
        $match: {
          $or: [{ "invoiceDetails.invoiceNo": invoiceNo }],
        },
      },
      {
        $lookup: {
          from: "salesorders",
          let: { id: "$so_db_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$id"] },
              },
            },
          ],
          as: "salesorder",
        },
      },
      {
        $project: {
          so_db_id: 1,
          soId: 1,
          isDelivered: 1,
          orderPlacedAt: "$createdAt",
          invoiceNo: "$invoiceDetails.invoiceNo",
          "itemSupplied.itemId": 1,
          "itemSupplied._id": 1,
          "itemSupplied.itemName": 1,
          noOfCrates: { $first: "$salesorder.crateIn" },
        },
      },

      {
        $lookup: {
          from: "spotSales",
          localField: "spotSalesId",
          foreignField: "_id",
          as: "spotSales",
        },
      },
    ];
    let invoiceDetail = await invoiceMasterModel.aggregate(pipeline);

    console.log("");

    try {
      info("Getting invoice Detail!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        invoiceDetail || [],
        this.messageTypes.deliveryExecutiveInvoiceFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };


  uploadDocuments = async (req, res, next) => {
    try {
      info("Uploading scanned documents!");
      let dataToUpdate, isUpdated;
      let salesOrdersId =
        req.params.salesOrdersId || req.query.salesOrdersId || req.body.salesOrdersId; // get the onboarding id
      // let customerName = req.body.onBoarding.name || req.params.salesOrder;  // this has to eb changes
      // let type = req.body.type;
      //console.log('images ===>', req.body.fileInfo)
      for (let i = 0; i < req.body.fileInfo.length; i++) {
        // get the file name
        let fileName = `customers/-${salesOrdersId}/`;
        let fileStream = req.body.fileInfo[i].b64;
        let streamLength = req.body.fileInfo[i].b64Length;

        // data
        let data = await blobService.createBlockBlobFromStream(
          containerName,
          fileName + `original-${req.body.fileInfo[i].originalName}`,
          fileStream,
          streamLength,
          (err) => {
            if (err) {
              error("Original Upload Fail", err);
              return {
                success: false,
              };
            }
            console.log("IMAGE UPLOAD IS COMPLETED !");
            return {
              success: true,
            };
          }
        );
        //  console.log("data",data)
        dataToUpdate = {
          $addToSet: {
            invoiceUploads: (azureUrl + data.name)
          },
        };
        // console.log(azureUrl,'this is azureUrl')
        // console.log('datetoupdate',dataToUpdate)
        // console.log('salesOrdersId',salesOrdersId)



        // console.log("dataToUpdate",updatedData)
        // inserting data into the db
        isUpdated = await salesOrderModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(salesOrdersId),
          },
          dataToUpdate,
          {
            new: true,
            upsert: false,
            lean: true,
          }
        )
      }
      console.log('isUpdated', isUpdated)
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          id: salesOrdersId,
          msg: isUpdated,
        },
        this.messageTypes.fileSuccessfullyUploaded
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      return this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  customerSignature = async (req, res, next) => {
    try {
      info('Uploading signature to the DB !');
      let salesOrdersId =
        req.params.salesOrdersId || req.query.salesOrdersId || req.body.salesOrdersId; // get the onboarding id
      // let customerName = req.body.onBoarding.name || req.params.deliveryExId;  // this has to eb changes
      // let type = req.body.type;

      // get the file name 
      let fileName = `customers/$-${salesOrdersId}/`;
      let fileStream = req.body.fileInfo.b64;
      let streamLength = req.body.fileInfo.b64Length;

      // data
      let data = await blobService.createBlockBlobFromStream(
        containerName, fileName + `original-${req.body.fileInfo.originalName}`,
        fileStream,
        streamLength,
        err => {
          if (err) {
            error('Original Upload Fail', err);
            return {
              success: false
            };
          }
          console.log('IMAGE UPLOAD IS COMPLETED !');
          return {
            success: true
          }
        });

      let dataToUpdate = {
        $set: {
          customerSignature: (azureUrl + data.name)
        },
      };

      // inserting data into the db
      let isUpdated = await salesOrderModel.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(salesOrdersId),
        },
        dataToUpdate,
        {
          new: true,
          upsert: false,
          lean: true,
        }
      );

      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        id: salesOrdersId,
        msg: isUpdated,
      }, this.messageTypes.fileSuccessfullyUploaded);

      // catch any runtime error 
    } catch (err) {
      error(err);
      return this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  uploadImageCustomerNotAvailable = async (req, res, next) => {
    try {
      info("upload photos if customer is not available");
      let dataToUpdate, isUpdated;
      let salesOrdersId =
        req.params.salesOrdersId || req.query.salesOrdersId || req.body.salesOrdersId; // get the onboarding id
      // let customerName = req.body.onBoarding.name || req.params.salesOrder;  // this has to eb changes
      // let type = req.body.type;
      //console.log('images ===>', req.body.fileInfo)
      for (let i = 0; i < req.body.fileInfo.length; i++) {
        // get the file name
        let fileName = `customers/-${salesOrdersId}/`;
        let fileStream = req.body.fileInfo[i].b64;
        let streamLength = req.body.fileInfo[i].b64Length;

        // data
        let data = await blobService.createBlockBlobFromStream(
          containerName,
          fileName + `original-${req.body.fileInfo[i].originalName}`,
          fileStream,
          streamLength,
          (err) => {
            if (err) {
              error("Original Upload Fail", err);
              return {
                success: false,
              };
            }
            console.log("IMAGE UPLOAD IS COMPLETED !");
            return {
              success: true,
            };
          }
        );
        //  console.log("data",data)
        dataToUpdate = {
          $addToSet: {
            customerNotAvailable: (azureUrl + data.name)
          },
        };
        // console.log(azureUrl,'this is azureUrl')
        // console.log('datetoupdate',dataToUpdate)
        // console.log('salesOrdersId',salesOrdersId)



        // console.log("dataToUpdate",updatedData)
        // inserting data into the db
        isUpdated = await salesOrderModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(salesOrdersId),
          },
          dataToUpdate,
          {
            new: true,
            upsert: false,
            lean: true,
          }
        )
      }
      console.log('isUpdated', isUpdated)
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          id: salesOrdersId,
          msg: isUpdated,
        },
        this.messageTypes.fileSuccessfullyUploaded
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      return this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  getInvoiceVewAfterPayment = async (req, res, next) => {
    let user = req.user, // user
      deliveryExecutiveId = user._id;
    let invoiceId = req.query.invoiceid;
    let soId = req.query.soId || 0;

    let pipeline = [
       { $match: { soId: soId } },
  {
    $lookup: {
      from: "salesorders",
      localField: "so_db_id",
      foreignField: "_id",
      as: "saleorder",
    },
  },
  {
    $lookup: {
      from: "decollections",
      localField: "soId",
      foreignField: "soId",
      as: "decollection",
    }
  },
  {
      "$project":{
         "so_db_id":1,
         "isDelivered":1,
         "orderPlacedAt":"$createdAt",
         "pendingCrates": { $first:"$saleorder.crateOutWithItem"},
         "noOfCratesOut" : { $first:"$saleorder.crateOut"},
         "invoiceNo":"$invoiceDetails.invoiceNo",
         "itemSupplied.itemId":1,
         "itemSupplied._id":1,
         "itemSupplied.suppliedQty":1,
         "itemSupplied.quantity":1,
         "credit":{ $first:"$decollection.collectionAmount"},
         "photos":{ $first:"$saleorder.invoiceUploads"},
         "itemSupplied.itemName":1,
         "soId":1,
      }
  }
];
    let invoiceDetail = await invoiceMasterModel.aggregate(pipeline);

    try {
      info("Getting invoice Detail!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        invoiceDetail || [],
        this.messageTypes.deliveryExecutiveInvoiceFetchedSuccessfully
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };


  disputeAcceptOrReject = async (req, res, next) => {
    let id = req.params.disputeId || req.query.disputeId || req.body.disputeId;
    let condition = req.params.condition == "accept" ? 1 : 0;

    let updatedDisputeDetail;

    // update checked quantity and reason

    try {
      let updateObj = {
        isAccepted: condition
      };

      updatedDisputeDetail = await disputeModel.findOneAndUpdate(
        {
          disputeId: parseInt(id),
        },
        { $set: { ...updateObj } }
      );
      info("Dispute is being Accepted or Recjected");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        updatedDisputeDetail || [],
        this.messageTypes.disputeDetailsUpdated
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err),
        this.messageTypes.disputeDetailsNotUpdated
      );
    }
  };


}

module.exports = new DeliveryExecutivetrip();
