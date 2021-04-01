// controllers
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

const BasicCtrl = require("../../basic_config/basic_config.controller");
const BaseController = require("../../baseController");
const Model = require("./models/purchase_order.model");
const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../utils").logging;
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
class purchaseController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.purchaseOrder;
  }

  getPOList = async (req, res) => {
    try {
      var page = req.query.page || 1,
        sortingArray = {},
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 10;
        });
      let skip = parseInt(page - 1) * pageSize;
      sortingArray["receivingStatus"] = -1;
      sortingArray["delivery_date"] = -1;
      let todaysDate = moment().format("YYYY-MM-DD");
      let todaysEndDate = moment().format("YYYY-MM-DD");
      info("Get Purchase order  details !", req.body, req.query, req.params);
      let query = {
        company_code:1000,
        plant:req.user.plant_code,
        receivingStatus: { $ne: 1 }, //to-do// check if qury working properly
        end_of_validity_period: { $gt: todaysDate },
        // delivery_date:{$lte:todaysEndDate}//to-do
      };
      if (req.query.poNumber) {
        query.po_number = {
          $regex: req.query.poNumber,
          $options: 'i'
        };
      }
      // get the total PO
      let totalPO = await Model.countDocuments({
        ...query,
      });
      var poList = await Model.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: "purchaseorderreceivingdetails",
            let: {
              id: "$_id",
              poRecStatus: "$receivingStatus",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$poId", "$$id"] },
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
                  pickerBoyId:1
                },
              },
            ],
            as: "poDetails",
          },
        },
        {
          $unwind: {
            path: "$poDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            po_number: 1,
            vendor_no: 1,
            supplierName: 1,
            itemCount: { $size: "$item" },
            poReceivingId: "$poDetails",
            receivingStatus: 1,
            item: 1,
          },
        },
        {
          $match: {
            $or: [
              {
                "poReceivingId.pickerBoyId": mongoose.Types.ObjectId(req.user._id)
                ,
              },
              { "poReceivingId.pickerBoyId": { $exists: false } },
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
      ]);
      poList.forEach((order) => {
        let count = 0;
        order.item.forEach((item) => {
          if (!item.received_qty) {
            count++;
          } else if (item.received_qty && item.received_qty < item.quantity) {
            count++;
          }
        });
        order.itemCount = count;
        delete order.item;
      });
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          result: poList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalPO,
          },
        },
        this.messageTypes.poListFetched
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

  getPODetails = async (req, res) => {
    try {
      info("Get Purchase order  details !", req.body, req.query, req.params);

      var poDetails = await Model.aggregate([
        {
          $match: {
            // poStatus: 1,
            // isDeleted: 0,
            _id: mongoose.Types.ObjectId(req.params.poId),
          },
        },
        {
          $project: {
            po_number: 1,
            vendor_no: 1,
            supplierName: 1,
            "item._id": 1,
            "item.material_no": 1,
            "item.item_name": 1,
            "item.quantity": 1,
            "item.net_price": 1,
            "item.pending_qty": 1,
            "item.mrp": 1,
            pending_qty: 1,
            received_qty: 1,
            delivery_date: 1,
          },
        },
      ]);

      // success
      if(poDetails && poDetails[0] && poDetails[0].item){
        for (let i = 0; i < poDetails[0].item.length; i++) {
          // adding recieved quantity in po order and gettinf fullfilment status
          poDetails[0].item[i].quantity = poDetails[0].item[i].pending_qty
            ? poDetails[0].item[i].pending_qty
            : poDetails[0].item[i].quantity;
        }
      }

      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        poDetails,
        this.messageTypes.poListFetched
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

  startPickUP = async (req, res) => {
    try {
      info("Get Purchase order  details !", req.body, req.query, req.params);
      var poList = await Model.findOne({
        status: 1,
        isDeleted: 0,
      }).lean();
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        poList,
        this.messageTypes.userDetailsFetched
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
  modifyPo = async (query, updateData) => {
    try {
      var poDetails = await Model.findOneAndUpdate(query, updateData, {
        newValue: true,
        useFindAndModify: false,
      });
      return {
        success: true,
        data: poDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  get = async (poId) => {
    try {
      var poDetails = await Model.aggregate([
        {
          $match: {
            // isDeleted: 0, //to-do
            _id: mongoose.Types.ObjectId(poId),
          },
        },
        {
          $project: {
            po_number: 1,
            document_date: 1,
            vendor_no: 1,
            item: 1,
            delivery_date: 1,
            sapGrnNo:1,
            delivery_date_array:1,

          },
        },
      ]);
      return {
        success: true,
        data: poDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };

  vendorDetails = async (req, res) => {
    try {
      info("Get Purchase order  details !", req.body, req.query, req.params);

      var sellerDetails = await Model.findOne(
        {
          // poStatus: 1,//to-do
          // isDeleted: 0,
          _id: mongoose.Types.ObjectId(req.params.poId),
        },
        {
          po_number: 1,
          vendor_no: 1,
          supplierName: 1,
          supplierPhone: 1,
        }
      ).lean();
      if (sellerDetails) {
        sellerDetails.location = "Banglore";
        sellerDetails.warehouse = "Banglore";
        sellerDetails.address = "Banglore";
      } else {
        sellerDetails = {};
      }
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        sellerDetails,
        this.messageTypes.poListFetched
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
  poFilteredList =async(req,res)=>{
    try {
      info("Get Purchase order  filtered list !", req.body, req.query, req.params);

      var page = req.query.page || 1,
        sortingArray = {},
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 10;
        });
      let skip = parseInt(page - 1) * pageSize;
      sortingArray["receivingStatus"] = -1;
      sortingArray["delivery_date"] = -1;
      let todaysDate = moment().format("YYYY-MM-DD");
      let todaysEndDate = moment().format("YYYY-MM-DD");
      let query = {
        
      };
      if (req.query.poNumber) {
        query.po_number = {
          $regex: req.query.poNumber,
          $options: 'is'
        };
      }
      if(req.query.type=='history'){
        req.query.receivingStatus=1
      }else if(req.query.type=='pending'){
        req.query.receivingStatus=2;
        // req.query['item.quantity']={$ne:''};

      }else if(req.query.type=='ongoing'){
        req.query.receivingStatus=4
      }
      // get the total PO
      let totalPO = await Model.countDocuments({
        ...query,
      });
      var poList = await Model.aggregate([
        {
          $match: query,
        },
        {
          $project: {
            po_number: 1,
            vendor_no: 1,
            supplierName: 1,
            itemCount: { $size: "$item" },
            poReceivingId: "$poDetails",
            receivingStatus: 1,
            updatedAt:1,
            item: 1,
            sapGrnNo:1
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
      ]);
    
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          result: poList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalPO,
          },
        },
        this.messageTypes.poListFetched
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
}

// exporting the modules
module.exports = new purchaseController();
