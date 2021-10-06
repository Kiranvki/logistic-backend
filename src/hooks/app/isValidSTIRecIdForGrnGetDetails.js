// Controller
const stiReceivingCtrl = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in_receiving_details/stock_transfer_in_receiving_details.controller");

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
    info("Check whether STI Receiving Id is valid or not");
    let objectId = mongoose.Types.ObjectId; // object id
    let stiReceivingId = req.params.stiReceivingId; // get the sale order id

    // mongoose valid id
    if (objectId.isValid(stiReceivingId)) {
      // check whether the sale Order id is unique or not
      let stiReceivingDetails = await stiReceivingCtrl.getForGrnGeneration(
        stiReceivingId
      );

      // if email is unique
      if (
        stiReceivingDetails.success &&
        stiReceivingDetails.data &&
        stiReceivingDetails.data.length
      ) {
        info("Valid SaleOrder");
        req.body.stiReceivingDetails = stiReceivingDetails.data[0];

        next();
      } else {
        error("INVALID Purchase Order receiving ID!");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.stockTransferIn
            .stiReceivingIdEitherDeletedOrDeactivated
        );
      }
    } else {
      error("The StockTransfer receiving ID is Invalid !");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.stockTransferIn.invalidStockTransferReceivingId
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
