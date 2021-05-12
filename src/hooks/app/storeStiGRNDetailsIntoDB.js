// Controller
const stiCtrl = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in/stock_transfer_in.controller");
const Model = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in_GRN/models/stock_transfer_in_GRN.model");
const _ = require("lodash");

// Responses & others utils
const Response = require("../../responses/response");
const StatusCodes = require("../../facades/response");
const MessageTypes = require("../../responses/types");
const Exceptions = require("../../exceptions/Handler");
const mongoose = require("mongoose");
const { error, info } = require("../../utils").logging;
let FULFILMENTSTATUS = {
  partial: 2,
  fulfilled: 1,
};

// padding the numbers
const pad = (n, width, z) => {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

// exporting the hooks
module.exports = async (req, res, next) => {
  try {
    info("Check whether STI Id is valid or not");
    let stiReceivingDetails = req.body.stiReceivingDetails;
    let stiDetails = req.body.stiDetails;
    let pickerBoyId = mongoose.Types.ObjectId(req.user._id);
    let receivedItemsMaterialNumber = [];
    var dateToday = new Date();
    var stiDeliveryDate = stiDetails.picking_date;
    let fulfilmentStatus = req.body.fulfilmentStatus;

    //filtering basket items based on delivery_quantity as for 0 delivery_quantity GRN cant be generated
    for (let i = 0; i < stiReceivingDetails.item.length; i++) {
      let item = stiReceivingDetails.item[i];
      receivedItemsMaterialNumber.push(item.material);

      stiReceivingDetails.item[i].pending_qty =
        item.delivery_quantity - (item.received_qty ? item.received_qty : 0);
    }
    req.body.receivedItemsMaterialNumber = receivedItemsMaterialNumber;

    let grnCreateData = {
      sapGrnNo: req.body.sapGrnNo,
      stiReceivingId: stiReceivingDetails._id,
      stiId:stiDetails._id,
      po_number: stiDetails.po_number,
      delivery_no:stiDetails.delivery_no,
      receivingStatus:
        fulfilmentStatus == FULFILMENTSTATUS.fulfilled
          ? FULFILMENTSTATUS.fulfilled
          : FULFILMENTSTATUS.partial,
      fulfilmentStatus: fulfilmentStatus,
      picking_date: stiDeliveryDate,
      picking_date_array: stiDetails.picking_date_array,
      generatedBy: pickerBoyId,
      item: stiReceivingDetails.item,
      receiving_plant:stiDetails.receiving_plant,
      supply_plant:stiDetails.supply_plant,
      supply_plant_name:stiDetails.supply_plant_name,
      supply_plant_city:stiDetails.supply_plant_city,

    };
    var grnDetails = await Model.create(grnCreateData);
    let grnNo = `GRN${dateToday.getFullYear()}${pad(
      parseInt(dateToday.getMonth() + 1),
      2
    )}${pad(parseInt(dateToday.getDay()), 2)}${pad(
      parseInt(grnDetails.grnSequence % 99999),
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
      req.body.grnDetails = grnDetails;
      next();
    } else {
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.stockTransferIn.grnNotGenerated
      );
    }

    // catch any runtime error
  } catch (e) {
    error(e);
    Response.errors(
      req,
      res,
      StatusCodes.HTTP_INTERNAL_SERVER_ERROR,
      Exceptions.internalServerErr(req, e)
    );
  }
};
