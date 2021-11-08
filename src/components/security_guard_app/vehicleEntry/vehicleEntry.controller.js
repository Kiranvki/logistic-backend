const BaseController = require("../../baseController");
const BasicCtrl = require("../../basic_config/basic_config.controller");
const masterModel = require("../../vehicle/vehicle_master/models/vehicle_master.model");
const attendanceModel = require("../../vehicle/vehicle_attendance/models/vehicle_attendance.model");
const tripModel = require("../../MyTrip/assign_trip/model/trip.model");
const invoiceModel = require("../../picker_app/invoice_master/models/invoice_master.model");
const salesOrderModel = require("../../sales_order/sales_order/models/sales_order.model");
const camelCase = require("camelcase");
const mongoose = require("mongoose");
const { error, info } = require("../../../utils").logging;
const _ = require("lodash");
const moment = require("moment");

class vehicleEntryController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.securityGuardApp;
  }

  // get entry vehicle list after delivery
  entryVehicleList = async (req, res, next) => {
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
      "transporterDetails.vehicle": {
        $regex: searchKey,
        $options: "is",
      },
      $or: [{ isCompleteDeleiveryDone: 1 }, { isPartialDeliveryDone: 1 }],
    };

    let pipeline = [
      {
        $match: {
          ...searchObject,
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

  // get entry vehicle details by trip Id
  entryVehicleDetails = async (req, res, next) => {
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
            noOfCrates: { $first: "$salesorder.crateIn" },

            invoices: {
              $push: {
                invoiceNo: "$salesorder.invoices.invoiceDetails.invoiceNo",
                gpnNo: { $first: "$salesorder.invoices.gpnNumber.gpn" },
                deliveryFlag: "$salesorder.invoices.isDelivered",
                customerName: "$salesorder.sold_to_party_description",
                address: "$salesorder.invoices.shippingDetails.address",
                city: "$salesorder.invoices.shippingDetails.cityId",
                deliveryStatus: "Delivered",
                categoryType: "Sales Order",
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

  //update the returned crates after delivery
  updateCratesQuantity = async (req, res, next) => {
    let id = req.params.id;
    let cratesRemaining =
      req.params.crates || req.query.crates || req.body.crates;
    let updatedOrderDetail;

    // update crate numbers

    try {
      let updateObj = {
        cratesReturned: parseInt(cratesRemaining) || "",
      };

      updatedOrderDetail = await salesOrderModel.update(
        {
          _id: mongoose.Types.ObjectId(id),
        },
        { $set: { ...updateObj } }
      );

      info("Crates Numbers Updating!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        updatedOrderDetail || [],
        this.messageTypes.cratesUpdated
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

  //verify invoice after trip
  verifyDeliveredInvoice = async (req, res) => {
    try {
      info("Update Invoice Status !");

      let invoice = req.params.invoiceNo;

      // creating data to insert
      let dataToUpdate = {
        $set: {
          isDelivered: 1,
        },
      };

      // inserting data into the db
      let isUpdated = await invoiceModel.findOneAndUpdate(
        {
          "invoiceDetails.invoiceNo": invoice,
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
          this.messageTypes.invoiceVerified
        );
      else
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.invoiceNotVerified
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

module.exports = new vehicleEntryController();
