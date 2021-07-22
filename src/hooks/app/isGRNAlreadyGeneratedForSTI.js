// Controller
const stiGrnController = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in_GRN/stock_transfer_in_GRN.controller");

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
    info("Check whether the GRN already generated for STI");
    let objectId = mongoose.Types.ObjectId; // object id
    let stiReceivingId = req.params.stiReceivingId; // get the sale order id

    // mongoose valid id
    if (objectId.isValid(stiReceivingId)) {
      // check whether the sale Order id is already added or not
      let stiGrnDetails = await stiGrnController.get({
        stiReceivingId: stiReceivingId,
        status:1,
        isDeleted:0
      });

      // if sales order Id is not added
      if (stiGrnDetails.success && !stiGrnDetails.recordNotFound) {
        error("Stock Transfer IN GRN already generated");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.stockTransferIn.grnAlreadyGenerated
        );
      }
      if (stiGrnDetails.recordNotFound) {
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
      error("The PickerBoy SalesOrder Mapping Id is Invalid !");
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
