// controllers
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

const BasicCtrl = require("../../../basic_config/basic_config.controller");
const BaseController = require("../../../baseController");
const Model = require("./models/stock_transfer_in_receiving_details.model");
const stiCtrl = require("../stock_transfer_in/stock_transfer_in.controller");

const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../../utils").logging;
const moment = require("moment");
// self apis

// padding the numbers
const pad = (n, width, z) => {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

// getting the model
class stockTransferReceivingDetailsController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.stockTransferIn;
  }

  startPickUP = async (req, res) => {
    try {
      info("Add SalesOrder in Picking state a !");

      // get the sale Order Details
      let stiDetails = req.body.stiDetails;
      stiDetails.item = stiDetails.item.filter((item) => {
        return item.delivery_quantity != item.received_qty;
      });
      stiDetails.item.forEach((item) => {
        item.delivery_quantity = item.pending_qty ? item.pending_qty : item.delivery_quantity;
        item.received_qty = 0;
      });

      let dataToInsert = {
        stiId: stiDetails._id,
        pickerBoyId: mongoose.Types.ObjectId(req.user._id),
        createdBy: req.user.email,
        receivingDate: new Date(),
        item: stiDetails.item,
      };

      // inserting data into the db
      let isInserted = await Model.create(dataToInsert);
      let stiUpdateDetails = await stiCtrl.modifySti(
        { _id: stiDetails._id, status: 1, isDeleted: 0 },
        { receivingStatus: 4 }
      );

      // check if inserted
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          isInserted,
          this.messageTypes.startedReceiving
        );
      } else {
        error("Error while adding in packing collection !");
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.startedNotReceiving
        );
      }
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

  stiReceivingList = async (req, res) => {
    try {
      var stiReceivingId = req.params.stiReceivingId;
      info(
        "Get Stock Transfer IN  receiving details !",
        req.body,
        req.query,
        req.params
      );
      let query = {
        _id: mongoose.Types.ObjectId(stiReceivingId),
        isDeleted: 0,
      };
      var stiList = await Model.findOne(query).populate({
        path: "stiId",
        select: {
          po_number: 1,
            delivery_no: 1,
          supply_plant_city: 1,
          supply_plant_name: 1,
          picking_date: 1,
        },
      }).lean();
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        { result: stiList },
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

  receiveSTIItem = async (req, res) => {
    try {
      var material = req.params.material;
      var stiReceivingId = req.params.stiReceivingId;
      var received_qty = req.body.received_qty;
      var remarks = req.body.remarks;
      var date_of_manufacturing = req.body.date_of_manufacturing || new Date();
      if (date_of_manufacturing) {
        date_of_manufacturing = moment(new Date(date_of_manufacturing))
          .set({
            h: 0,
            m: 0,
            s: 0,
            millisecond: 0,
          })
          .format("YYYY-MM-DD hh:mm:ss");
      }

      info("Receiving STI item!");
      let query = {
        _id: mongoose.Types.ObjectId(stiReceivingId),
        "item._id": mongoose.Types.ObjectId(material),
      };
      let updateData = {
        "item.$.received_qty": received_qty,
        "item.$.date_of_manufacturing": date_of_manufacturing,
        // "item.$.is_edited":1
      };
      if (remarks) {
        updateData["item.$.remarks"] = remarks;
      } else {
        updateData["item.$.remarks"] = "";
      }
      var updatedSTI = await Model.findOneAndUpdate(query, updateData, {
        newValue: true,
        useFindAndModify: false,
      });
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        this.messageTypes.receiveSTIItem
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

  getSTIReceivingDetails = async (stiId) => {
    try {
      info("Get STIReceiving details !");

      // get details
      return Model.find({
        stiId: stiId,
        isDeleted: 0,
      })
        .lean()
        .then((res) => {
          if (res && res.length) {
            return {
              success: true,
              data: res,
            };
          } else {
            error("Error Searching Data in sti DB!");
            return {
              success: false,
            };
          }
        })
        .catch((err) => {
          error(err);
          return {
            success: false,
            error: err,
          };
        });

      // catch any runtime error
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  basketList = async (req, res) => {
    try {
      var stiReceivingId = req.params.stiReceivingId;
      info(
        "Get Stock Transfer IN  receiving details !",
        req.body,
        req.query,
        req.params
      );
      let query = {
        _id: mongoose.Types.ObjectId(stiReceivingId),
        isDeleted: 0,
        "item.received_qty": { $gt: 0 }, //to-do not workinfg properly
        // 'item.is_edited': 1//to-do not workinfg properlu
      };
      var bucketList = await Model.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "stock_transfer_in",
            let: {
              id: "$stiId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$id"] },
                      { $eq: ["$receivingStatus", 4] },
                      { $eq: ["$isDeleted", 0] },

                      // { $gt: ["$item.delivery_quantity", "$item.received_qty"] },//not working need to check later //to-do
                    ],
                  },
                },
              },

              { $limit: 1 },
              {
                $project: {
                  _id: 1,
                  po_number: 1,
                  delivery_no: 1,
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
        /* {
          $addFields: {
            basketTotal: {
              $sum: {
                $map: {
                  input: "$item",
                  as: "item",
                  in: {
                    $round: [
                      {
                        $multiply: ["$$item.net_price", "$$item.received_qty"],
                      },
                      4,
                    ],
                  },
                },
              },
            },

            totalTax: {
              $sum: {
                $map: {
                  input: "$item",
                  as: "item",
                  in: {
                    $round: [
                      {
                        $multiply: [
                          "$$item.taxable_value",
                          "$$item.received_qty",
                        ],
                      },
                      4,
                    ],
                  },
                },
              },
            },
            totalDiscount: {
              $sum: {
                $map: {
                  input: "$item",
                  as: "item",
                  in: {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$$item.discount_amount",
                              "$$item.delivery_quantity",
                            ],
                          },
                          "$$item.received_qty",
                        ],
                      },
                      4,
                    ],
                  },
                },
              },
            },
          },
        }, */
        {
          $project: {
            item: 1,
            // totalDiscount: 1,
            // totalTax: 1,
            // basketTotal: 1,
            stiDetails: 1,
          },
        },
      ]).allowDiskUse(true);
      if (
        bucketList &&
        bucketList[0] &&
        bucketList[0].item &&
        bucketList[0].item.length
      ) {
     /*    bucketList[0].total =
          bucketList[0].basketTotal -
          bucketList[0].totalDiscount +
          bucketList[0].totalTax;
        bucketList[0].netWeight = 0; */

        // success
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          { result: bucketList },
          this.messageTypes.bucketListFetchedSuccessfully
        );
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.emptyBucketList
        );
      }

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
  generateGRN = async (req, res) => {
    try {
      var stiReceivingId = req.params.stiReceivingId;
      info(
        "Get Stock transfer receiving details !",
        req.body,
        req.query,
        req.params
      );
      var stiReceivingId = req.params.stiReceivingId;
      let query = {
        _id: mongoose.Types.ObjectId(stiReceivingId),
        isDeleted: 0,
      };
      var bucketList = await Model.aggregate([
        { $match: query },
        /* {
          $addFields: {
            basketTotal: {
              $sum: {
                $map: {
                  input: "$item",
                  as: "item",
                  in: {
                    $round: [
                      {
                        $multiply: ["$$item.net_price", "$$item.received_qty"],
                      },
                      4,
                    ],
                  },
                },
              },
            },

            totalTax: {
              $sum: {
                $map: {
                  input: "$item",
                  as: "item",
                  in: {
                    $round: [
                      {
                        $multiply: [
                          "$$item.taxable_value",
                          "$$item.received_qty",
                        ],
                      },
                      4,
                    ],
                  },
                },
              },
            },
            totalDiscount: {
              $sum: {
                $map: {
                  input: "$item",
                  as: "item",
                  in: {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$$item.discount_amount",
                              "$$item.delivery_quantity",
                            ],
                          },
                          "$$item.received_qty",
                        ],
                      },
                      4,
                    ],
                  },
                },
              },
            },
          },
        }, */
        {
          $project: {
            "item._id": 1,
            "item.material": 1,
            "item.material_description": 1,
            "item.delivery_quantity": 1,
            "item.mrp": 1,
            "item.received_qty": 1,
          },
        },
      ]).allowDiskUse(true);

      if (
        bucketList &&
        bucketList[0] &&
        bucketList[0].item &&
        bucketList[0].item.length
      ) {
        /* bucketList[0].total =
          bucketList[0].basketTotal -
          bucketList[0].totalDiscount +
          bucketList[0].totalTax; */
        // success
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          { result: bucketList },
          this.messageTypes.bucketListFetchedSuccessfully
        );
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.emptyBucketList
        );
      }
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
  get = async (query) => {
    try {
      var stiReceivingDetails = await Model.aggregate([
        {
          $match: query,
        },
        {
          $project: {
            stiId: 1,
            item: 1,
            pickerBoyId: 1,
            receivingStatus: 4,
          },
        },
      ]).allowDiskUse(true);
      return {
        success: true,
        data: stiReceivingDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  getReceivingItem = async (stiReceivingId, itemId) => {
    try {
      var stiReceivingDetails = await Model.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(stiReceivingId),
            "item._id": mongoose.Types.ObjectId(itemId),
            receivingStatus: 4,
          },
        },
        { $unwind: "$item" },
        {
          $match: {
            "item._id": mongoose.Types.ObjectId(itemId),
          },
        },
        {
          $project: {
            stiId: 1,
            item: 1,
            pickerBoyId: 1,
            receivingStatus: 4,
          },
        },
      ]).allowDiskUse(true);
      return {
        success: true,
        data: stiReceivingDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };

  getForGrnGeneration = async (stiReceivingId) => {
    try {
      let query = {
        _id: mongoose.Types.ObjectId(stiReceivingId),
        isDeleted: 0,
        // 'item.received_qty':{$gt:0}// not adding this as we need filtered and unfiltered both list
      };
      //calculate net value also when
      var stiReceivingDetails = await Model.aggregate([
        { $match: query },
        /* {
          $addFields: {
            total: {
              $sum: {
                $map: {
                  input: "$item",
                  as: "item",
                  in: {
                    $round: [
                      {
                        $multiply: ["$$item.net_price", "$$item.received_qty"],
                      },
                      4,
                    ],
                  },
                },
              },
            },

            totalTax: {
              $sum: {
                $map: {
                  input: "$item",
                  as: "item",
                  in: {
                    $round: [
                      {
                        $multiply: [
                          { $divide: ["$$item.itemTax", "$$item.delivery_quantity"] },
                          "$$item.received_qty",
                        ],
                      },
                      4,
                    ],
                  },
                },
              },
            },
            totalDiscount: {
              $sum: {
                $map: {
                  input: "$item",
                  as: "item",
                  in: {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$$item.discount_amount",
                              "$$item.delivery_quantity",
                            ],
                          },
                          "$$item.received_qty",
                        ],
                      },
                      4,
                    ],
                  },
                },
              },
            },
          },
        }, */
        {
          $project: {
            item: 1,
            totalDiscount: 1,
            totalTax: 1,
            total: 1,
            stiId: 1,
          },
        },
      ]).allowDiskUse(true);
      if (stiReceivingDetails && stiReceivingDetails.length) {
        let item = stiReceivingDetails[0].item.filter((item) => {
          return item.received_qty > 0;

          // return item.is_edited>0
        });
        stiReceivingDetails[0].item = item;
       /*  stiReceivingDetails[0].netValue =
          stiReceivingDetails[0].total +
          stiReceivingDetails[0].totalDiscount -
          stiReceivingDetails[0].totalTax; */
      }
      return {
        success: true,
        data: stiReceivingDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
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
}

// exporting the modules
module.exports = new stockTransferReceivingDetailsController();
