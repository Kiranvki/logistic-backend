// Controller
const stiReceivingController = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in_receiving_details/stock_transfer_in_receiving_details.controller");

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
    info("Check whether quantity entered has valid value");
    let objectId = mongoose.Types.ObjectId; // object id
    let stiReceivingId = req.params.stiReceivingId; // get the sale order id
    var material = req.params.material;
    var received_qty = req.body.received_qty;
    var remarks = req.body.remarks;

    // mongoose valid id
    if (objectId.isValid(material)) {
      // check whether the sale Order id is already added or not
      let stiReceivingItemDetails = await stiReceivingController.getReceivingItem(
        stiReceivingId,
        material
      );

      // if sales order Id is not added
      if (
        stiReceivingItemDetails.success &&
        stiReceivingItemDetails.data &&
        stiReceivingItemDetails.data.length
      ) {
        if (
          stiReceivingItemDetails.data[0].item.delivery_quantity != received_qty &&
          !remarks
        ) {
          info("Remarks required");
          return Response.errors(
            req,
            res,
            StatusCodes.HTTP_CONFLICT,
            MessageTypes.stockTransferIn.requiredRemark
          );
        }
        if (stiReceivingItemDetails.data[0].item.delivery_quantity < received_qty) {
          info("Received quantity greter than required quantity");
          return Response.errors(
            req,
            res,
            StatusCodes.HTTP_CONFLICT,
            MessageTypes.stockTransferIn.receivedQuantityGreaterThanQty
          );
        }
        if (stiReceivingItemDetails.data[0].item.delivery_quantity == received_qty) {
          req.body.remarks = "";
        }
        req.body.stiReceivingItemDetails = stiReceivingItemDetails.data[0];
        next();
      } else {
        info("Invalid item id");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.stockTransferIn.invalidItemId
        );
      }
    } else {
      error("The ReceiverBoy  Mapping Id is Invalid !");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.stockTransferIn.receiverItemIdInvalid
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
