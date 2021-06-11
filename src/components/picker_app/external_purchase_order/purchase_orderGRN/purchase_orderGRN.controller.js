let FULFILMENTSTATUS={
  partial:2,
  fulfilled:1
}
const BasicCtrl = require("../../../basic_config/basic_config.controller");
const BaseController = require("../../../baseController");
const Model = require("./models/purchase_orderGRN.model");
const poReceivingCtrl = require("../purchase_order_receiving_details/purchase_order_receiving_details.controller");
const poCtrl = require("../purchase_order/purchase_order.controller");

const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../../utils").logging;
const moment = require("moment");
const { isArray } = require("lodash");
// self apis

// getting the model
class purchaseController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.purchaseOrder;
  }

  grnDetails = async (req, res) => {
    try {
      info("Get Purchase order GRN details !");

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

  updateGRNDetails = async (req, res) => {
    try {
      let poReceivingDetails = req.body.poReceivingDetails;
      let poDetails = req.body.poDetails;
      let pickerBoyId = mongoose.Types.ObjectId(req.user._id);
      let receivedItemsMaterialNumber = req.body.receivedItemsMaterialNumber;
      let grnDetails =req.body.grnDetails;
      let todaysDate = moment()
        .set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0,
        })
        .format("YYYY-MM-DD");

      let fulfilmentStatus = req.body.fulfilmentStatus;
      
        if (poDetails.sapGrnNo && poDetails.sapGrnNo.length)
          poDetails.sapGrnNo.push({
            sapGrnNo: req.body.sapGrnNo,
            date: todaysDate,
            itemsNoArray: receivedItemsMaterialNumber,
            grnId: grnDetails._id,
            pickerBoyId: pickerBoyId,
          });
        else
          poDetails.sapGrnNo = [
            {
              sapGrnNo: req.body.sapGrnNo,
              date: todaysDate,
              itemsNoArray: receivedItemsMaterialNumber,
              grnId: grnDetails._id,
              pickerBoyId: pickerBoyId,
            },
          ];
        await poCtrl.modifyPo(
          {
            _id: poDetails._id,
            status: 1,
            isDeleted: 0, //to-do
          },
          {
            receivingStatus: fulfilmentStatus == FULFILMENTSTATUS.fulfilled ? FULFILMENTSTATUS.fulfilled : FULFILMENTSTATUS.partial,
            fulfilmentStatus: fulfilmentStatus,
            item: poDetails.item,
            sapGrnNo: poDetails.sapGrnNo,
            delivery_date: poDetails.delivery_date,
            delivery_date_array: poDetails.delivery_date_array,
          }
        );

        await poReceivingCtrl.modifyPo(
          {
            _id: poReceivingDetails._id,
            status: 1,
          },
          {
            receivingStatus: fulfilmentStatus == FULFILMENTSTATUS.fulfilled ? FULFILMENTSTATUS.fulfilled : FULFILMENTSTATUS.partial,
            fulfilmentStatus: fulfilmentStatus,
            item: poReceivingDetails.item,
            isDeleted: 1,
          }
        );
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          grnDetails,
          this.messageTypes.invoiceCreated
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
  set = async (record) => {
    try {
      return await Model.create(record);
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
