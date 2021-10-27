const BaseController = require("../../baseController");
const BasicCtrl = require("../../basic_config/basic_config.controller");
const tripModel = require("../../MyTrip/assign_trip/model/trip.model");
const disputeModel = require("../../MyTrip/assign_trip/model/disputes.model");
const gpnModel = require("../../delivery_app/deliveryExecutiveTrip/model/gpn_model");

const mongoose = require("mongoose");
const { error, info } = require("../../../utils").logging;
const _ = require("lodash");
const moment = require("moment");

class disputesController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.securityGuardApp;
  }

  getDisputes = async (req, res, next) => {
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
          status: 1,
          disputeDate: "$createdAt",
          invoicesNo: { $first: "$invoices.invoiceDetails.invoiceNo" },
          tripId: "$tripId",
          deliveryExecutiveName: "",
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

  getDisputeDetails = async (req, res, next) => {
    console.log(req.query.page);
    let pageSize = 100;
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
      { $match: { disputeId: parseInt(disputeId) } },
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

  notifyDispute = async (req, res, next) => {
    try {
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

  scanReturnGpn = async (req, res, next) => {
    let gpnId = req.params.gpn;
    info("getting gpn details!");

    let gpnDetails = await gpnModel
      .aggregate([
        { $match: { gpn: gpnId } },
        {
          $lookup: {
            from: "salesorders",
            localField: "salesOrderId",
            foreignField: "_id",
            as: "salesorder",
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

        //   {$unwind:{path:"$result", preserveNullAndEmptyArrays:false}},
        { $unwind: { path: "$salesorder", preserveNullAndEmptyArrays: false } },
        { $unwind: { path: "$invoices", preserveNullAndEmptyArrays: false } },
        {
          $project: {
            orderType: "$orderType",
            invoiceNo: { $first: "$invoiceNumber" },
            customer: "$salesorder.sold_to_party_description",
            orderStatus: "$invoices.isDelivered",
            deliveryDate: "$invoices.so_deliveryDate",
            itemSupplied: {
              $cond: {
                if: { $isArray: "$invoices.itemSupplied" },
                then: { $size: "$invoices.itemSupplied" },
                else: "NA",
              },
            },
            orderItems: {
              $filter: {
                input: "$salesorder.orderItems",
                as: "items",
                cond: { $eq: ["$$items.orderDetails.itemDeliveryStatus", 2] },
              },
            },
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

  getDisputeItemsMinifiedList = async (req, res, next) => {
    let invoiceNo = req.params.invoice;
    let itemsList = await gpnModel.aggregate([
      { $match: { invoiceNumber: { $in: [invoiceNo] } } },
      {
        $lookup: {
          from: "trips",
          localField: "tripId",
          foreignField: "_id",
          as: "trips",
        },
      },
      {
        $project: { tripId: { $first: "$trips.tripId" }, _id: 0, invoiceId: 1 },
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
          itemId: { $first: "$invoices.itemSupplied.material_no" },
          tripId: 1,
          invoiceNumber: { $first: "$invoices.invoiceDetails.invoiceNo" },
        },
      },
    ]);
    console.log(itemsList);

    let data = {
      results: itemsList,
    };

    try {
      info("getting item Ids list!");

      // success response
      this.success(
        req,
        res,
        this.status.HTTP_OK,
        data || [],
        this.messageTypes.itemsIdsFetched
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err),
        this.messageTypes.itemsIdsNotFetched
      );
    }
  };
}

module.exports = new disputesController();
