let FULFILMENTSTATUS = {
  partial: 2,
  fulfilled: 1,
};
const moment = require("moment");

// Responses & others utils
const Response = require("../../responses/response");
const StatusCodes = require("../../facades/response");
const MessageTypes = require("../../responses/types");
const Exceptions = require("../../exceptions/Handler");
const mongoose = require("mongoose");
const { error, info } = require("../../utils").logging;

// exporting the hooks
module.exports = async (req, res, next) => {
  try {
    let stiReceivingDetails = req.body.stiReceivingDetails;
    let stiDetails = req.body.stiDetails;
    let todaysDate = moment()
      .set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0,
      })
      .format("YYYY-MM-DD");

    let fulfilmentStatus = FULFILMENTSTATUS.fulfilled;
    for (let i = 0; i < stiDetails.item.length; i++) {
      // adding recieved quantity in sti order and gettind fullfilment status
      let item = stiDetails.item[i];
      let recievingItem = stiReceivingDetails.item.filter((Ritem) => {
        return item.material == Ritem.material;
      });

      if (recievingItem && recievingItem[0]) {
        item.received_qty =
          (item.received_qty ? item.received_qty : 0) +
          recievingItem[0].received_qty;
      } else {
        item.received_qty = item.received_qty ? item.received_qty : 0;
      }
      stiDetails.item[i].pending_qty =
        item.quantity - (item.received_qty ? item.received_qty : 0);
      if (item.quantity != item.received_qty) {
        fulfilmentStatus = FULFILMENTSTATUS.partial;
      }
    }
    var upcoming_delivery_date = req.body.upcoming_delivery_date; //format received 'yyyy-mm-dd'

    if (
      fulfilmentStatus == FULFILMENTSTATUS.partial &&
      !upcoming_delivery_date
    ) {
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.stockTransferIn.upcomingDeliverDateMissing
      );
    } else if (fulfilmentStatus == FULFILMENTSTATUS.partial) {
      upcoming_delivery_date = moment(new Date(upcoming_delivery_date))
        .set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0,
        })
        .format("YYYY-MM-DD");
      if (upcoming_delivery_date < todaysDate) {
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.stockTransferIn.pastDateNotAllowedforUDD
        );
      }
      if (
        stiDetails.delivery_date_array &&
        Array.isArray(stiDetails.delivery_date_array)
      ) {
        stiDetails.delivery_date_array.push(upcoming_delivery_date);
      } else {
        stiDetails.delivery_date_array = [
          stiDetails.delivery_date,
          upcoming_delivery_date,
        ];
      }
      stiDetails.delivery_date = upcoming_delivery_date;
    }
    req.body.stiDetails = stiDetails;
    req.body.fulfilmentStatus = fulfilmentStatus;
    next();
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
