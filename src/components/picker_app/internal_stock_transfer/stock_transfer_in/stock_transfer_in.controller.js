// controllers
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');
const request = require("request-promise");

const BasicCtrl = require("../../../basic_config/basic_config.controller");
const BaseController = require("../../../baseController");
const Model = require("./models/stock_transfer_in.model");
const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../../utils").logging;
const moment = require("moment");
const { forEach } = require("lodash");
// self apis

// padding the numbers
const pad = (n, width, z) => {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

// getting the model
class stockTransferController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.stockTransferIn;
  }

  getSTIList = async (req, res) => {
    try {
      var userId = mongoose.Types.ObjectId(req.user._id);
      var page = req.query.page || 1,
        sortingArray = {},
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 10;
        });
      let skip = parseInt(page - 1) * pageSize;
      sortingArray["receivingStatus"] = -1;
      sortingArray["picking_date"] = -1;
      let todaysDate = moment().format("YYYY-MM-DD");
      let todaysEndDate = moment().format("YYYY-MM-DD");
      info("Get Stock Transfer IN  details !");
      let query = {
        receiving_plant: req.user.plant ? req.user.plant.toString() : "", //consider data type
        receivingStatus: { $ne: 1 }, //to-do// check if qury working properly
        item: { $exists: true },
        status: 1,
        isDeleted: 0,
        "item.delivery_quantity": { $gt: 0 },
        // "item.status": "Not yet processed"//to-do
        // picking_date:{$lte:todaysEndDate}//to-do
      };
      var projectObject = {
        po_number: 1,
        "item.delivery_quantity": 1,
        "item.material": 1,
        "item.higher_level_item": 1,
        "item.delivery_item_no": 1,
      };
      if (req.query.poNumber) {
        query.po_number = {
          $regex: req.query.poNumber,
          $options: "i",
        };
      }
      // get the total STI
      let totalSTI = await Model.countDocuments(query);
      var stiList = await Model.aggregate([
        // {
        //   $project: projectObject,
        // },
        
        { $unwind: "$item" },
        {
          $match: query,
        },
        {
          $group: {
            _id: {
              sti_id: "$_id",
              higher_level_item: "$item.higher_level_item",
              material: "$item.material",
            },
            deliveryQuantity: { $sum: "$item.delivery_quantity" },
            receivedQuantity: { $sum: "$item.received_qty" },
            pendingQuantity: { $sum: "$item.pending_qty" },
            po_number: { $first: "$po_number" },
            supply_plant: { $first: "$supply_plant" },
            supply_plant_name: { $first: "$supply_plant_name" },
            supply_plant_city: { $first: "$supply_plant_city" },
            delivery_no: { $first: "$delivery_no" },
            receivingStatus: { $first: "$receivingStatus" },
            fulfilmentStatus: { $first: "$fulfilmentStatus" },
            item: { $first: "$item" },
          },
        },
        {
          $addFields: {
            "item.delivery_quantity": "$deliveryQuantity",
            "item.received_qty": "$receivedQuantity",
            "item.pending_qty": "$pendingQuantity",
          },
        },
        {
          $group: {
            _id: {
              sti_id: "$_id.sti_id",
            },
            po_number: { $first: "$po_number" },
            supply_plant: { $first: "$supply_plant" },
            supply_plant_name: { $first: "$supply_plant_name" },
            supply_plant_city: { $first: "$supply_plant_city" },
            delivery_no: { $first: "$delivery_no" },
            receivingStatus: { $first: "$receivingStatus" },
            fulfilmentStatus: { $first: "$fulfilmentStatus" },
            item: { $push: "$item" },
          },
        },
        {
          $lookup: {
            from: "stocktransferinreceivingdetails",
            let: {
              id: "$_id.sti_id",
              poRecStatus: "$receivingStatus",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$stiId", "$$id"] },
                      { $eq: ["$$poRecStatus", 4] },
                      { $eq: ["$isDeleted", 0] },

                      // { $gt: ["$item.quantity", "$item.received_qty"] },//not working need to check later //to-do
                    ],
                  },
                },
              },

              { $limit: 1 },
              {
                $project: {
                  _id: 1,
                  pickerBoyId: 1,
                },
              },
            ],
            as: "stiDetails",
          },
        },
        {
          $unwind: {
            path: "$stiDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: "$_id.sti_id",
            po_number: 1,
            supply_plant: 1,
            supply_plant_name: 1,
            supply_plant_city: 1,
            delivery_no: 1,
            receivingStatus: 1,
            fulfilmentStatus: 1,
            "item.delivery_quantity":1,
            "item.material":1,
            "item.material_description":1,
            "item.uom":1,
            "item.higher_level_item":1,
            "item.po_item":1,
            "item.delivery_item_no":1,
            "item.received_qty":1,
            "item.pending_qty":1,
            itemCount: { $size: "$item" },
            stiReceivingId: "$stiDetails",
          },
        },
        {
          $match: {
            $or: [
              {
                "stiReceivingId.pickerBoyId": userId,
              },
              { "stiReceivingId.pickerBoyId": { $exists: false } },
            ],
          },
        },
        {
          $sort: sortingArray,
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
      ]).allowDiskUse(true);
      stiList.forEach((order) => {
        let count = 0;
        order.item.forEach((item) => {
          if (!item.received_qty) {
            count++;
          } else if (
            item.received_qty &&
            item.received_qty < item.delivery_quantity
          ) {
            count++;
          }
        });
        order.itemCount = count;
        delete order.item;
      });
      stiList = stiList.filter((order)=>{
        return order && order.itemCount && order.itemCount>0 ;
      })
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          result: stiList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalSTI,
          },
        },
        this.messageTypes.stiListFetched
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

  getSTIDetails = async (req, res) => {
    try {
      info("Get Stock Transfer IN  details !");

      var stiDetails = await Model.aggregate([
        { $unwind: "$item" },
        {
          $match: {
            status: 1,
            isDeleted: 0,
            _id: mongoose.Types.ObjectId(req.params.stiId),
            "item.delivery_quantity": { $gt: 0 },

          },
        },
        {
          $group: {
            _id: {
              sti_id: "$_id",
              higher_level_item: "$item.higher_level_item",
              material: "$item.material",
            },
            deliveryQuantity: { $sum: "$item.delivery_quantity" },
            receivedQuantity: { $sum: "$item.received_qty" },
            pendingQuantity: { $sum: "$item.pending_qty" },
            po_number: { $first: "$po_number" },
            supply_plant: { $first: "$supply_plant" },
            supply_plant_name: { $first: "$supply_plant_name" },
            supply_plant_city: { $first: "$supply_plant_city" },
            delivery_no: { $first: "$delivery_no" },
            picking_date: { $first: "$picking_date" },
            receivingStatus: { $first: "$receivingStatus" },
            fulfilmentStatus: { $first: "$fulfilmentStatus" },
            item: { $first: "$item" },
          },
        },
        {
          $addFields: {
            "item.delivery_quantity": "$deliveryQuantity",
            "item.received_qty": "$receivedQuantity",
            "item.pending_qty": "$pendingQuantity",
          },
        },
        {
          $group: {
            _id: {
              sti_id: "$_id.sti_id",
            },
            po_number: { $first: "$po_number" },
            supply_plant: { $first: "$supply_plant" },
            supply_plant_name: { $first: "$supply_plant_name" },
            supply_plant_city: { $first: "$supply_plant_city" },
            delivery_no: { $first: "$delivery_no" },
            receivingStatus: { $first: "$receivingStatus" },
            picking_date: { $first: "$picking_date" },
            fulfilmentStatus: { $first: "$fulfilmentStatus" },
            item: { $push: "$item" },
          },
        },
        {
          $project: {
            _id: "$_id.sti_id",
            po_number: 1,
            supply_plant: 1,
            supply_plant_name: 1,
            supply_plant_city: 1,
            delivery_no: 1,
            receivingStatus: 1,
            picking_date: 1,
            fulfilmentStatus: 1,
            "item.delivery_quantity":1,
            "item.material":1,
            "item.material_description":1,
            "item.uom":1,
            "item.higher_level_item":1,
            "item.po_item":1,
            "item.delivery_item_no":1,
            "item.received_qty":1,
            "item.pending_qty":1,
          },
        },
      ]).allowDiskUse(true);

      // success
      if (stiDetails && stiDetails[0] && stiDetails[0].item) {
        for (let i = 0; i < stiDetails[0].item.length; i++) {
          // adding recieved delivery_quantity in sti order and gettinf fullfilment status
          stiDetails[0].item[i].delivery_quantity = stiDetails[0].item[i]
            .pending_qty
            ? stiDetails[0].item[i].pending_qty
            : stiDetails[0].item[i].delivery_quantity;
        }
      }

      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        stiDetails,
        this.messageTypes.stiListFetched
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

  // startPickUP = async (req, res) => {
  //   try {
  //     info("Get Stock Transfer IN  details !", req.body, req.query, req.params);
  //     var stiList = await Model.findOne({
  //       status: 1,
  //       isDeleted: 0,
  //     }).lean();
  //     // success
  //     return this.success(
  //       req,
  //       res,
  //       this.status.HTTP_OK,
  //       stiList,
  //       this.messageTypes.userDetailsFetched
  //     );

  //     // catch any runtime error
  //   } catch (err) {
  //     error(err);
  //     this.errors(
  //       req,
  //       res,
  //       this.status.HTTP_INTERNAL_SERVER_ERROR,
  //       this.exceptions.internalServerErr(req, err)
  //     );
  //   }
  // };
  modifySti = async (query, updateData) => {
    try {
      var stiDetails = await Model.findOneAndUpdate(query, updateData, {
        newValue: true,
        useFindAndModify: false,
      });
      return {
        success: true,
        data: stiDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  getDetailedSti = async (stiId) => {
    try {
      var stiDetails = await Model.aggregate([
        {
          $match: {
            isDeleted: 0, //to-do
            status:1,
            _id: mongoose.Types.ObjectId(stiId),
          }
        }
      ]).allowDiskUse(true);
      return {
        success: true,
        data: stiDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  get = async (stiId) => {
    try {
      var stiDetails = await Model.aggregate([
        { $unwind: "$item" },
        {
          $match: {
            isDeleted: 0, //to-do
            _id: mongoose.Types.ObjectId(stiId),
            "item.delivery_quantity": { $gt: 0 },
          },
        },
        {
          $group: {
            _id: {
              sti_id: "$_id",
              higher_level_item: "$item.higher_level_item",
              material: "$item.material",
            },
            deliveryQuantity: { $sum: "$item.delivery_quantity" },
            receivedQuantity: { $sum: "$item.received_qty" },
            pendingQuantity: { $sum: "$item.pending_qty" },
            po_number: { $first: "$po_number" },
            supply_plant: { $first: "$supply_plant" },
            supply_plant_name: { $first: "$supply_plant_name" },
            supply_plant_city: { $first: "$supply_plant_city" },
            delivery_no: { $first: "$delivery_no" },
            picking_date: { $first: "$picking_date" },
            receivingStatus: { $first: "$receivingStatus" },
            fulfilmentStatus: { $first: "$fulfilmentStatus" },
            picking_date_array: { $first: "$picking_date_array" },
            sapGrnNo: { $first: "$sapGrnNo" },
            item: { $first: "$item" },
          },
        },
        {
          $addFields: {
            "item.delivery_quantity": "$deliveryQuantity",
            "item.received_qty": "$receivedQuantity",
            "item.pending_qty": "$pendingQuantity",
          },
        },
        {
          $group: {
            _id: {
              sti_id: "$_id.sti_id",
            },
            po_number: { $first: "$po_number" },
            supply_plant: { $first: "$supply_plant" },
            supply_plant_name: { $first: "$supply_plant_name" },
            supply_plant_city: { $first: "$supply_plant_city" },
            delivery_no: { $first: "$delivery_no" },
            receivingStatus: { $first: "$receivingStatus" },
            picking_date: { $first: "$picking_date" },
            picking_date_array: { $first: "$picking_date_array" },
            sapGrnNo: { $first: "$sapGrnNo" },
            fulfilmentStatus: { $first: "$fulfilmentStatus" },
            item: { $push: "$item" },
          },
        },
        {
          $project: {
            _id: "$_id.sti_id",
            po_number: 1,
            supply_plant: 1,
            supply_plant_name: 1,
            supply_plant_city: 1,
            delivery_no: 1,
            receivingStatus: 1,
            picking_date: 1,
            fulfilmentStatus: 1,
            item: 1,
          }
        },
      ]).allowDiskUse(true);
      return {
        success: true,
        data: stiDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  
  stiFilteredList = async (req, res) => {
    try {
      info("Get Stock Transfer IN  filtered list !");
      let type = req.params.type;
      let pickerBoyId = mongoose.Types.ObjectId(req.user._id);
      var page = req.query.page || 1,
        sortingArray = {},
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 10;
        });
      let skip = parseInt(page - 1) * pageSize;
      let todaysDate = moment().format("YYYY-MM-DD");
      let todaysEndDate = moment().format("YYYY-MM-DD");
      var projectList = {
        po_number: 1,
        delivery_no: 1,
        supply_plant_city: 1,
        supply_plant_name: 1,
        supply_plant: 1,
        stiReceivingId: "$stiDetails",
        receivingStatus: 1,
        updatedAt: 1,
        picking_date: 1,
      };
      let query = {
        status: 1,
        isDeleted: 0,
      };
      if (req.query.poNumber) {
        query.po_number = {
          $regex: req.query.poNumber,
          $options: "is",
        };
      }
      
      if (type == "history") {
        query.receivingStatus = 1;
        query["sapGrnNo.pickerBoyId"] = pickerBoyId;
        projectList.itemCount = { $size: "$item" };
        sortingArray["updatedAt"] = -1;
        projectList.sapGrnNo = 1;
      } else if (type == "pending") {
        if (req.query.date) {
          query["picking_date"] = moment
            .utc(new Date(req.query.date))
            .utcOffset("+05:30")
            .format("YYYY-MM-DD");
        }
        query.receivingStatus = 2;
        query["sapGrnNo.pickerBoyId"] = pickerBoyId;
        projectList.item = 1;
        projectList.sapGrnNo = 1;
      } else if (type == "ongoing") {
        
        query.receivingStatus = 4;
        projectList.item = 1;
        projectList.stiReceivingId = "$stiDetails";
      }
      sortingArray["picking_date"] = -1;
      sortingArray["po_number"] = -1;
      // get the total STI
      if (type == "pending" || type == "history") {
        var totalSTI = await Model.countDocuments({
          ...query,
        });
        var stiList = await Model.aggregate([
          {
            $match: query,
          },
          {
            $group: {
              _id: {
                sti_id: "$_id",
                higher_level_item: "$item.higher_level_item",
                material: "$item.material",
              },
              deliveryQuantity: { $sum: "$item.delivery_quantity" },
              receivedQuantity: { $sum: "$item.received_qty" },
              pendingQuantity: { $sum: "$item.pending_qty" },
              po_number: { $first: "$po_number" },
              supply_plant: { $first: "$supply_plant" },
              supply_plant_name: { $first: "$supply_plant_name" },
              supply_plant_city: { $first: "$supply_plant_city" },
              delivery_no: { $first: "$delivery_no" },
              receivingStatus: { $first: "$receivingStatus" },
              fulfilmentStatus: { $first: "$fulfilmentStatus" },
              sapGrnNo:{$first:'$sapGrnNo'},
              item: { $first: "$item" },
            },
          },
          {
            $addFields: {
              "item.delivery_quantity": "$deliveryQuantity",
              "item.received_qty": "$receivedQuantity",
              "item.pending_qty": "$pendingQuantity",
            },
          },
          {
            $group: {
              _id: {
                sti_id: "$_id.sti_id",
              },
              po_number: { $first: "$po_number" },
              supply_plant: { $first: "$supply_plant" },
              supply_plant_name: { $first: "$supply_plant_name" },
              supply_plant_city: { $first: "$supply_plant_city" },
              delivery_no: { $first: "$delivery_no" },
              receivingStatus: { $first: "$receivingStatus" },
              fulfilmentStatus: { $first: "$fulfilmentStatus" },
              sapGrnNo:{ $first:'$sapGrnNo'},
              item: { $push: "$item" },
            },
          },
          {
            $project: projectList,
          },
          {
            $sort: sortingArray,
          },
          {
            $skip: skip,
          },
          {
            $limit: pageSize,
          },
        ]).allowDiskUse(true);
      } else {
        var totalSTI = await Model.countDocuments({
          ...query,
        });
        var stiList = await Model.aggregate([
          {
            $match: query,
          },
          {
            $group: {
              _id: {
                sti_id: "$_id",
                higher_level_item: "$item.higher_level_item",
                material: "$item.material",
              },
              deliveryQuantity: { $sum: "$item.delivery_quantity" },
              receivedQuantity: { $sum: "$item.received_qty" },
              pendingQuantity: { $sum: "$item.pending_qty" },
              po_number: { $first: "$po_number" },
              supply_plant: { $first: "$supply_plant" },
              supply_plant_name: { $first: "$supply_plant_name" },
              supply_plant_city: { $first: "$supply_plant_city" },
              delivery_no: { $first: "$delivery_no" },
              receivingStatus: { $first: "$receivingStatus" },
              fulfilmentStatus: { $first: "$fulfilmentStatus" },
              item: { $first: "$item" },
            },
          },
          {
            $addFields: {
              "item.delivery_quantity": "$deliveryQuantity",
              "item.received_qty": "$receivedQuantity",
              "item.pending_qty": "$pendingQuantity",
            },
          },
          {
            $group: {
              _id: {
                sti_id: "$_id.sti_id",
              },
              po_number: { $first: "$po_number" },
              supply_plant: { $first: "$supply_plant" },
              supply_plant_name: { $first: "$supply_plant_name" },
              supply_plant_city: { $first: "$supply_plant_city" },
              delivery_no: { $first: "$delivery_no" },
              receivingStatus: { $first: "$receivingStatus" },
              fulfilmentStatus: { $first: "$fulfilmentStatus" },
              item: { $push: "$item" },
            },
          },
          {
            $lookup: {
              from: "stocktransferinreceivingdetails",
              let: {
                id: "$_id.sti_id",
                stiRecStatus: "$receivingStatus",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$stiId", "$$id"] },
                        { $eq: ["$$stiRecStatus", 4] },
                        { $eq: ["$isDeleted", 0] },
                        {
                          $eq: [
                            "$pickerBoyId",
                            mongoose.Types.ObjectId(req.user._id),
                          ],
                        },
                        // { $gt: ["$item.delivery_quantity", "$item.received_qty"] },//not working need to check later //to-do
                      ],
                    },
                  },
                },

                { $limit: 1 },
                {
                  $project: {
                    _id: 1,
                    pickerBoyId: 1,
                    receivingDate:'$createdAt'
                  },
                },
              ],
              as: "stiDetails",
            },
          },
          {
            $unwind: {
              path: "$stiDetails",
            },
          },
          {
            $project: projectList,
          },
          {
            $limit: pageSize,
          },
        ]).allowDiskUse(true);
      }
      // if(type=='pending'){
      //   if(stiList && stiList.length){
      //     stiList.forEach((element)=>{
      //       let itemCount=0
      //       element.item.forEach((item)=>{
      //         if(item.received_qty>0){
      //           itemCount++;
      //         }
      //       })
      //       element.itemCount=itemCount;
      //       delete element.item;
      //     })
      //   }
      // }
      if (stiList && stiList.length) {
        stiList.forEach((element) => {
          if (type == "ongoing" || type == "pending") {
            let itemCount = 0;
            element.item.forEach((item) => {
              if (
                !item.received_qty ||
                item.received_qty != item.delivery_quantity
              ) {
                itemCount++;
              }
            });
            element.itemCount = itemCount;
            delete element.item;
          }

          if (type == "pending" || type == "history") {
            element.deliveredDate =
              element.sapGrnNo[element.sapGrnNo.length - 1].date;
          }
          delete element.sapGrnNo;
        });
      }
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          result: stiList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalSTI,
          },
        },
        this.messageTypes.stiListFetched
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

  filteredSTIDetails = async (req, res) => {
    try {
      info("STI filtered list details");
      var type = req.query.type || "history";
      var stiDetails = {};
      var projectList = {
        po_number: 1,
        delivery_no: 1,
        supply_plant: 1,
        supply_plant_city: 1,
        supply_plant_name: 1,
        receivingStatus: 1,
        updatedAt: 1,
        picking_date: 1,
        sapGrnNo: 1,
      };
      if (type == "pending") {
        projectList.item = 1;
      }
      stiDetails = await Model.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.stiId),
          status: 1,
          isDeleted: 0,
        },
        projectList
      ).lean();

      if (stiDetails) {
        // success
        if (stiDetails && stiDetails && stiDetails.item && type == "pending") {
          let itemList = [];
          for (let i = 0; i < stiDetails.item.length; i++) {
            // adding recieved delivery_quantity in sti order and gettinf fullfilment status
            stiDetails.item[i].delivery_quantity = stiDetails.item[i]
              .pending_qty
              ? stiDetails.item[i].pending_qty
              : stiDetails.item[i].delivery_quantity;
            if (stiDetails.item[i].delivery_quantity > 0) {
              itemList.push(stiDetails.item[i]);
            }
          }
          stiDetails.item = itemList;
        }
        stiDetails.deliveredDate =
          stiDetails.sapGrnNo[stiDetails.sapGrnNo.length - 1].date;

        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          stiDetails,
          this.messageTypes.stiDetailsFetched
        );
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.stiDetailsNotFound
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

  insertPurchaseOrderData = async (sapRawData) => {
    try {
      if (sapRawData && sapRawData.length > 0) {
        var po_numberArrayFromSap = [];
        sapRawData = sapRawData.map((el) => {
          if (el) {
            po_numberArrayFromSap.push(el.po_number);
            if (el.po_number) {
              el.po_number = el.po_number.toString();
              el.isDeleted = 0;
              el.status = 1;
            }
          }
          return el;
        });

        const stiDataFromDb = await Model.find(
          {
            po_number: {
              $in: po_numberArrayFromSap,
            },
          },
          {
            po_number: 1,
          }
        );

        if (stiDataFromDb.length > 0) {
          const po_numberArrayFromdb = stiDataFromDb.map((el) => {
            if (el) {
              return el.po_number;
            }
          });
          const finalSTIArray = sapRawData.filter((val) => {
            return po_numberArrayFromdb.indexOf(val.po_number) == -1;
          });

          return await Model.insertMany(finalSTIArray);
        } else {
          return await Model.insertMany(sapRawData);
        }
      }
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
}

// exporting the modules
module.exports = new stockTransferController();
