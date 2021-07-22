let FULFILMENTSTATUS={
  partial:2,
  fulfilled:1
}
const BasicCtrl = require("../../../basic_config/basic_config.controller");
const BaseController = require("../../../baseController");
const Model = require("./models/stock_transfer_in_GRN.model");
const stiReceivingCtrl = require("../stock_transfer_in_receiving_details/stock_transfer_in_receiving_details.controller");
const stiCtrl = require("../stock_transfer_in/stock_transfer_in.controller");

const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../../utils").logging;
const moment = require("moment");
const { isArray } = require("lodash");
// self apis

// getting the model
class stockTransferReceivingDetailsController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.stockTransferIn;
  }

  grnDetails = async (req, res) => {
    try {
      info("Get Stock Transfer IN GRN details !");

      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        req.body.grnDetails,
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

  updateGRNDetails = async (req, res) => {
    try {
      let stiReceivingDetails = req.body.stiReceivingDetails;
      let stiDetails = req.body.stiDetails;
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
      
        if (stiDetails.sapGrnNo && stiDetails.sapGrnNo.length)
          stiDetails.sapGrnNo.push({
            sapGrnNo: req.body.sapGrnNo,
            date: todaysDate,
            materialNoArray: receivedItemsMaterialNumber,
            grnId: grnDetails._id,
            pickerBoyId: pickerBoyId,
          });
        else
          stiDetails.sapGrnNo = [
            {
              sapGrnNo: req.body.sapGrnNo,
              date: todaysDate,
              materialNoArray: receivedItemsMaterialNumber,
              grnId: grnDetails._id,
              pickerBoyId: pickerBoyId,
            },
          ];
        await stiCtrl.modifySti(
          {
            _id: stiDetails._id,
            status: 1,
            isDeleted: 0, //to-do
          },
          {
            receivingStatus: fulfilmentStatus == FULFILMENTSTATUS.fulfilled ? FULFILMENTSTATUS.fulfilled : FULFILMENTSTATUS.partial,
            fulfilmentStatus: fulfilmentStatus,
            item: stiDetails.item,
            sapGrnNo: stiDetails.sapGrnNo,
            picking_date: stiDetails.picking_date,
            picking_date_array: stiDetails.picking_date_array,
          }
        );

        await stiReceivingCtrl.modifySti(
          {
            _id: stiReceivingDetails._id,
            status: 1,
          },
          {
            receivingStatus: fulfilmentStatus == FULFILMENTSTATUS.fulfilled ? FULFILMENTSTATUS.fulfilled : FULFILMENTSTATUS.partial,
            fulfilmentStatus: fulfilmentStatus,
            item: stiReceivingDetails.item,
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
      var stiGRNDetails = await Model.findOne(query);
      if (stiGRNDetails) {
        return {
          success: true,
          data: stiGRNDetails,
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
module.exports = new stockTransferReceivingDetailsController();
