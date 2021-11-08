const BaseController = require("../../baseController");
const BasicCtrl = require("../../basic_config/basic_config.controller");
const tripModel = require("../../MyTrip/assign_trip/model/trip.model");
const gpnModel = require("../../delivery_app/deliveryExecutiveTrip/model/gpn_model");

const mongoose = require("mongoose");
const { error, info } = require("../../../utils").logging;
const _ = require("lodash");
const moment = require("moment");

class vehicleInfoController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.securityGuardApp;
  }

  // get trip details by vehicle number
  getTripByVehicleNumber = async (req, res, next) => {
    let pageNumber = req.query.page || 1,
      pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
        if (res.success) return res.data;
        else return 60;
      }),
      searchKey = req.query.search || "",
      sortBy = req.query.sortBy || "createdAt",
      sortingArray = {};

    sortingArray[sortBy] = -1;

    let dateToday = moment(Date.now())
      .set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0,
      })
      .toDate();

    let searchObject = {
      $or: [
        {
          "transporterDetails.vehicle": {
            $regex: searchKey,
            $options: "is",
          },
        },
        {
          vehicleModel: {
            $regex: searchKey,
            $options: "is",
          },
        },
      ],
    };

    let pipeline = [
      {
        $match: {
          $or: [
            {
              ...searchObject,
            },
            { createdAt: { $gte: dateToday } },
          ],
        },
      },
      {
        $unwind: "$transporterDetails",
      },

      {
        $project: {
          //  _id:0,
          //   deliveryDetails:0,
          //   vehicleId:0,
          //   checkedInId:0,
          //   rateCategoryId:0,
          totalCrate: { $sum: ["$salesOrder.crateIn"] },
          vehicleNumber: "$transporterDetails.vehicle",
          totalSpotSales: {
            $cond: {
              if: { $isArray: "$spotSalesId" },
              then: { $size: "$spotSalesId" },
              else: "NA",
            },
          },
          totalAssetTransfer: {
            $cond: {
              if: { $isArray: "$assetTransfer" },
              then: { $size: "$assetTransfer" },
              else: "NA",
            },
          },
          totalStockTransfer: {
            $cond: {
              if: { $isArray: "$stockTransferIds" },
              then: { $size: "$stockTransferIds" },
              else: "NA",
            },
          },
          totalSalesOrder: {
            $cond: {
              if: { $isArray: "$salesOrderId" },
              then: { $size: "$salesOrderId" },
              else: "NA",
            },
          },
          tripId: 1,
        },
      },

      {
        $skip: pageSize * (pageNumber - 1),
      },
      {
        $limit: pageSize,
      },
    ];

    let trip = await tripModel.aggregate(pipeline);
    let crates = await tripModel.aggregate([
      {
        $lookup: {
          from: "salesorders",
          localField: "salesOrderId",
          foreignField: "_id",
          as: "salesOrder",
        },
      },
      {
        $project: {
          totalCrate: { $sum: ["$salesOrder.crateIn"] },
        },
      },
    ]);

    let totalCount = await tripModel.count({
      ...searchObject,
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
      info("searching trip data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.tripListFetched
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err),
        this.messageTypes.tripListNotFetched
      );
    }
  };

  // get trip details by trip Id
  getTripDetailsByTripId = async (req, res, next) => {
    let ID = parseInt(req.params.tripId);
    info("getting trip data!");

    let trip = await tripModel
      .aggregate([
        {
          $match: { tripId: ID },
        },
        {
          $project: {
            vehicleRegNumber: 1,
            deliveryExecutiveEmpCode: 1,
            deliveryExecutiveName: 1,
            tripId: 1,
            salesOrder: 1,
          },
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
                    {
                      $lookup: {
                        from: "gatepassnumbers",
                        let: { id: "$invoiceDetails.invoiceNo" },
                        pipeline: [
                          {
                            $match: {
                              $expr: { $in: ["$$id", "$invoiceNumber"] },
                            },
                          },
                        ],
                        as: "gpnNumber",
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
        { $unwind: { path: "$salesorder", preserveNullAndEmptyArrays: false } },
        {
          $unwind: {
            path: "$salesorder.invoices",
            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $group: {
            _id: "$_id",
            vehicleRegNumber: { $first: "$vehicleRegNumber" },
            deliveryExecutiveEmpCode: { $first: "$deliveryExecutiveEmpCode" },
            deliveryExecutiveName: { $first: "$deliveryExecutiveName" },
            tripId: { $first: "$tripId" },
            // salesOrder: { $first: "$salesOrder" },
            noOfCrates: { $first: "$salesorder.crateIn" },
            // noOfDeliveries: 4,

            invoices: {
              $push: {
                invoiceNo: "$salesorder.invoices.invoiceDetails.invoiceNo",
                gpnNo: { $first: "$salesorder.invoices.gpnNumber.gpn" },
                gpnStatus: {
                  $first: "$salesorder.invoices.gpnNumber.status",
                },
                customerName: "$salesorder.sold_to_party_description",
                address: "$salesorder.invoices.shippingDetails.address",
                city: "$salesorder.invoices.shippingDetails.cityId",
                numberOfItems: 1,
                categoryType: "Sales Order",
              },
            },
          },
        },
        {
          $addFields: {
            noOfDeliveries: {
              $cond: {
                if: { $isArray: "$invoices" },
                then: { $size: "$invoices" },
                else: "NA",
              },
            },
          },
        },
      ])
      .allowDiskUse(true);

    let data = {
      results: trip,
    };

    try {
      info("getting vehicle trip data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.tripDetailsFetched
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err),
        this.messageTypes.tripDetailsNotFetched
      );
    }
  };

  // scan and get GPN details by GPN number
  getGpnDetails = async (req, res, next) => {
    let gpnId = req.params.gpn;
    info("getting gpn details!");

    let gpnDetails = await gpnModel
      .aggregate([
        { $match: { gpn: gpnId, isDeleted: 0 } },
        {
          $lookup: {
            from: "invoicemasters",
            let: { id: "$invoiceNumber" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: [["$invoiceDetails.invoiceNo"], "$$id"] },
                },
              },
              // {$project: {
              //     "gpn": 1,

              // }}
            ],
            as: "invoice",
          },
        },
        { $unwind: "$invoice" },
        {
          $project: {
            _id: 1,
            invoiceNumber: "$invoice.invoiceDetails.invoiceNo",
            // itemsSupplied: "$invoice.itemSupplied",
            // itemName: "$invoice.itemSupplied.itemName",
          },
        },
      ])
      .allowDiskUse(true);

    let data = {
      results: gpnDetails,
    };

    try {
      info("getting gpn data!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.gpnDetailsFetched
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err),
        this.messageTypes.gpnDetailsNotFetched
      );
    }
  };

  //verify gpn
  verifyGpn = async (req, res) => {
    try {
      info("GPN STATUS CHANGE !");

      let gpnId = req.params.gpn;

      // creating data to insert
      let dataToUpdate = {
        $set: {
          status: 1,
        },
      };

      // inserting data into the db
      let isUpdated = await gpnModel.findOneAndUpdate(
        {
          gpn: gpnId,
        },
        dataToUpdate,
        {
          new: true,
          upsert: false,
          lean: true,
        }
      );

      // check if inserted
      if (isUpdated && !_.isEmpty(isUpdated))
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          isUpdated,
          this.messageTypes.gpnVerified
        );
      else
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.gpnNotVerified
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

  getTripHistoryList = async (req, res, next) => {
    let type = req.params.type,
      pageNumber = req.query.page || 1,
      pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
        if (res.success) return res.data;
        else return 60;
      }),
      sortBy = req.query.sortBy || "createdAt",
      sortingArray = {};

    let startDate =
        req.query.startDate ||
        moment()
          .set({
            h: 0,
            m: 0,
            s: 0,
            millisecond: 0,
          })
          .toDate(),
      endDate =
        req.query.endDate ||
        moment()
          .set({
            h: 24,
            m: 24,
            s: 0,
            millisecond: 0,
          })
          .toDate();

    if (startDate && !_.isEmpty(startDate)) {
      startDate = moment(startDate, "DD-MM-YYYY")
        .set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0,
        })
        .toDate();
    }

    if (endDate && !_.isEmpty(endDate)) {
      endDate = moment(endDate, "DD-MM-YYYY")
        .set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0,
        })
        .toDate();
    }

    sortingArray[sortBy] = -1;
    let searchObject = {
      isActive: parseInt(type),
      createdAt: { $gte: startDate, $lte: endDate },
    };

    let trip = await tripModel
      .aggregate([
        {
          $match: { ...searchObject },
        },
        {
          $project: {
            truckName: { $first: "$transporterDetails.vehicle" },
            deliveryExecutive: {
              $first: "$transporterDetails.deliveryExecutiveName",
            },
            tripId: "$tripId",
          },
        },
        {
          $skip: pageSize * (pageNumber - 1),
        },
        {
          $limit: pageSize,
        },
      ])
      .allowDiskUse(true);

    let totalCount = await tripModel.count({
      ...searchObject,
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
      info("getting vehicle trip list!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.tripHistoryListFetched
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err),
        this.messageTypes.tripHistoryListNotFetched
      );
    }
  };

  getTripHistoryDetails = async (req, res, next) => {
    info("getting in trip data!");
    let tripId = req.params.tripId;
    let pipeline = [
      {
        $match: {
          $and: [
            {
              _id:mongoose.Types.ObjectId(tripId),
            },
            {
              isActive: 1,
            },
          ],
        },
      },{
        $lookup: {
          from:"vehiclemasters",
          localField:"vehicleId",
          foreignField:"_id",
          as: "vehicleDetails"
        }
      },{
          $lookup:{
              from:"deliveryexecutives",
              localField:"deliveryExecutiveId",
              foreignField:"_id",
              as:"deDetails"
          }
        },
      {
        $lookup: {
          from: "salesorders",
          localField: "salesOrder",
          foreignField: "_id",
          as: "soDetails"
        }
      },
      {
        $project: {
          tripId: 1,
          truckNumber: { $first: "$vehicleDetails.regNumber" },
          deName: { $first: "$deDetails.fullName" },
          employeeNumber: { $first: "$deDetails.zohoId" },
          noOfCrates: { $first: "$soDetails.crateIn" }

        }
      }
    ]

    let activeTripData = await tripModel.aggregate(pipeline);


    try {
      info("Getting trip Detail!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        activeTripData || [],
        this.messageTypes.tripHistoryListFetched
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

  //allow vehicle
  allowVehicle = async (req, res) => {
    try {
      info("Allow Vehicle for Trip !");
      let trip = req.params.tripId;
      console.log(trip);

      // creating data to insert
      let dataToUpdate = {
        $set: {
          isActive: 1,
        },
      };

      // inserting data into the db
      let isUpdated = await tripModel.findOneAndUpdate(
        {
          tripId: trip,
        },
        dataToUpdate,
        {
          new: true,
          upsert: false,
          lean: true,
        }
      );

      // check if inserted
      if (isUpdated && !_.isEmpty(isUpdated))
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          isUpdated,
          this.messageTypes.vehicleAllowed
        );
      else
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.vehicleNotAllowed
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
}

module.exports = new vehicleInfoController();
