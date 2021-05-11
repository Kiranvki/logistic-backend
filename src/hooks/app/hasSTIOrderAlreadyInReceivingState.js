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
    info(
      "Check whether the receiving boy already has pending order assigned to him"
    );
    let objectId = mongoose.Types.ObjectId; // object id
    let receiverId = mongoose.Types.ObjectId(req.user._id); // get the sale order id

    // mongoose valid id
    if (objectId.isValid(receiverId)) {
      // check whether the sale Order id is already added or not
      let stiReceivingDetails = await stiReceivingController.get({
        pickerBoyId: receiverId,
        receivingStatus: 4,
      });

      // if sales order Id is not added
      if (
        stiReceivingDetails.success &&
        stiReceivingDetails.data &&
        stiReceivingDetails.data.length
      ) {
        error("Already has 1 ongoing order");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.stockTransferIn.alreadyHasOngoinOrder
        );
      }
      if (
        stiReceivingDetails.success &&
        stiReceivingDetails.data &&
        !stiReceivingDetails.data.length
      ) {
        next();
      } else {
        info("Something went wrong");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.stockTransferIn.invalidStockTransferReceivingId
        );
      }
    } else {
      error("The ReceiverBoy  Mapping Id is Invalid !");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.stockTransferIn.receiverBoyIdInvalid
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
