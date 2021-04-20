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
    let poReceivingDetails = req.body.poReceivingDetails;
    let poDetails = req.body.poDetails;
    let todaysDate = moment()
      .set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0,
      })
      .format("YYYY-MM-DD");

    let fulfilmentStatus = FULFILMENTSTATUS.fulfilled;
    for (let i = 0; i < poDetails.item.length; i++) {
      // adding recieved quantity in po order and gettind fullfilment status
      let item = poDetails.item[i];
      let recievingItem = poReceivingDetails.item.filter((Ritem) => {
        return item.material_no == Ritem.material_no;
      });

      if (recievingItem && recievingItem[0]) {
        item.received_qty =
          (item.received_qty ? item.received_qty : 0) +
          recievingItem[0].received_qty;
      } else {
        item.received_qty = item.received_qty ? item.received_qty : 0;
      }
      poDetails.item[i].pending_qty =
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
        MessageTypes.purchaseOrder.upcomingDeliverDateMissing
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
          MessageTypes.purchaseOrder.pastDateNotAllowedforUDD
        );
      }
      if (
        poDetails.delivery_date_array &&
        Array.isArray(poDetails.delivery_date_array)
      ) {
        poDetails.delivery_date_array.push(upcoming_delivery_date);
      } else {
        poDetails.delivery_date_array = [
          poDetails.delivery_date,
          upcoming_delivery_date,
        ];
      }
      poDetails.delivery_date = upcoming_delivery_date;
    }
    req.body.poDetails = poDetails;
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
