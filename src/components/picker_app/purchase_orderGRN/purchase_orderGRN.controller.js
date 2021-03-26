// controllers
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

const BasicCtrl = require("../../basic_config/basic_config.controller");
const BaseController = require("../../baseController");
const Model = require("./models/purchase_orderGRN.model");
const poRecievingCtrl = require("../purchase_order_recieving_details/purchase_order_recieving_details.controller");
const poCtrl = require("../purchase_order/purchase_order.controller");

const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../utils").logging;
const moment = require("moment");
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

  grnDetails = async (req, res) => {
    try {
      info("Get Purchase order GRN details !", req.body, req.query, req.params);

      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        req.body.grnDetails,
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

  generateGRN = async (req, res) => {
    try {
      let poRecievingDetails = req.body.poRecievingDetails;
      let poDetails = await poCtrl.get(poRecievingDetails.poId);
      var dateToday = new Date();
      poDetails = poDetails.data[0];
      for (let i = 0; i < poRecievingDetails.orderItems.length; i++) {
        let item = poRecievingDetails.orderItems[i];
        if (item.quantity != item.recievedQty) {
          this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.grnGenerateQuantityMismatch
          );
          return;
        }
      }

      let grnData = {
        poRecievingId:poRecievingDetails._id,
        poNo: poDetails.poNo,
        recievingStatus: 3,
        poDate: poDetails.poDate,
        deliveryDate: poDetails.deliveryDate,
        poAmount: poRecievingDetails.total,
        netTotal: poRecievingDetails.netValue,
        totalTaxAmount: poRecievingDetails.totalTax,
        discount: poRecievingDetails.totalDiscount,
        generatedBy: req.user.email,
        orderItems: poRecievingDetails.orderItems,
        supplierDetails: {
          supplierCode: poDetails.supplierCode,
          supplierName: poDetails.supplierName,
          supplierPhone: poDetails.supplierPhone,
        },
      };
      var grnDetails = await Model.create(grnData);
      let grnNo = `GRN${dateToday.getFullYear()}${pad(
        parseInt(dateToday.getMonth() + 1),
        2
      )}${pad(parseInt(dateToday.getDay()), 2)}${pad(
        parseInt(grnDetails.sequence % 99999),
        5
      )}`;

      let isUpdated = await Model.updateOne(
        {
          _id: mongoose.Types.ObjectId(grnDetails._id),
        },
        {
          grnNo: grnNo,
        },
        {
          lean: true,
          multi: false,
          upsert: false,
          new: true,
          useFindAndModify: false,
        }
      );

      if (grnDetails && !_.isEmpty(grnDetails)) {
        info("GRN Successfully Created !");
        //add Invoice no.
        grnDetails.grnNo = grnNo;
        grnDetails.poVendorNumber = "NA";
        grnDetails.poVendorDate = "NA";

        await poCtrl.modifyPo({
          _id:poDetails._id,
          poStatus :1
        },{
          recievingStatus:3
        })

        await poRecievingCtrl.modifyPo({
            _id:poRecievingDetails._id,
            status:1
        },{
          recievingStatus:3
        })
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          grnDetails,
          this.messageTypes.invoiceCreated
        );
      } else
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.invoiceNotCreated
        );
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
      var poGRNDetails = await Model.findOne(query);
      if (poGRNDetails) {
        return {
          success: true,
          data: poGRNDetails,
        };
      } else {
        return {
          success: true,
          recordNotFound: 1,
        };
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
module.exports = new purchaseController();
