// Controller
const stiCtrl = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in/stock_transfer_in.controller");

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
    info("Check whether ST Id is valid or not");
    let objectId = mongoose.Types.ObjectId; // object id
    let stiReceivingDetails = req.body.stiReceivingDetails;
    // mongoose valid id
    if (objectId.isValid(stiReceivingDetails.stiId)) {
      // check whether the sale Order id is unique or not
      let stiDetails = await stiCtrl.get(stiReceivingDetails.stiId);

      // if email is unique
      if (stiDetails.success) {
        info("Valid SaleOrder");
        req.body.stiDetails = stiDetails.data[0];

        next();
      } else {
        error("INVALID StockTransfer!");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.stockTransferIn.stiIdInvalidEitherDeletedOrDeactivated
        );
      }
    } else {
      error("The StockTransfer ID is Invalid !");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.stockTransferIn.invalidStockTransferId
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
