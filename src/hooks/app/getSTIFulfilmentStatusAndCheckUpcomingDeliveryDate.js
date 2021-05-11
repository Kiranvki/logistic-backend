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
    // for (let i = 0; i < stiDetails.item.length; i++) {
    for (let i = 0; i < stiReceivingDetails.item.length; i++) {
      // adding recieved quantity in sti order and gettind fullfilment status
      let receivedItem = stiReceivingDetails.item[i];
      let stiReceivedItemArray = stiDetails.item.filter((item) => {
        // let stiReceivedItemArray = stiReceivingDetails.item.filter((Ritem) => {
        if (item.material == receivedItem.material) {
          if (Number(receivedItem.higher_level_item)) {
            if (item.higher_level_item == receivedItem.higher_level_item) {
              return true;
            } else {
              return false;
            }
          } else if (item.delivery_item_no == receivedItem.delivery_item_no) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      });

      if (stiReceivedItemArray && stiReceivedItemArray[0]) {
        let remainingQuantityReceived = receivedItem.received_qty;
        for (let j = 0; j < stiReceivedItemArray.length; j++) {
          if (remainingQuantityReceived > 0) {
            if (
              stiReceivedItemArray[j].delivery_quantity >=
              (stiReceivedItemArray[j].received_qty
                ? stiReceivedItemArray[j].received_qty
                : 0) +
                remainingQuantityReceived
            ) {
              stiReceivedItemArray[j].received_qty =
                (stiReceivedItemArray[j].received_qty
                  ? stiReceivedItemArray[j].received_qty
                  : 0) + remainingQuantityReceived;
              remainingQuantityReceived = 0;
            } else {
              remainingQuantityReceived =remainingQuantityReceived-
                (stiReceivedItemArray[j].delivery_quantity -
                (stiReceivedItemArray[j].received_qty
                  ? stiReceivedItemArray[j].received_qty
                  : 0));
              stiReceivedItemArray[j].received_qty =
                stiReceivedItemArray[j].delivery_quantity;
            }
          }
        }
        
      } else {
        // item.received_qty = item.received_qty ? item.received_qty : 0;
      }

    }
     for (let i = 0; i < stiDetails.item.length; i++) {
    stiDetails.item[i].pending_qty =
    stiDetails.item[i].delivery_quantity- (stiDetails.item[i].received_qty ? stiDetails.item[i].received_qty : 0);
    if(stiDetails.item[i].pending_qty>0){
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
