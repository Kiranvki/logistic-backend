// Controller
const stiGRNCtrl = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in_GRN/stock_transfer_in_GRN.controller");

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
    info("Check whether GRN Id is valid or not");
    let objectId = mongoose.Types.ObjectId; // object id
    let grnId = req.params.grnId; // get the sale order id

    // mongoose valid id
    if (objectId.isValid(grnId)) {
      // check whether the sale Order id is unique or not
      let grnDet = await stiGRNCtrl.get({
        _id: mongoose.Types.ObjectId(grnId),
        status: 1,
      });

      // if email is unique
      if (grnDet.success) {
        info("Valid Stock Transfer IN grn");
        req.body.grnDetails = grnDet.data;

        next();
      } else {
        error("INVALID StockTransfer GRN!");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.stockTransferIn.grnRecordNotExist
        );
      }
    } else {
      error("The StockTransfer grn ID is Invalid !");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.stockTransferIn.invalidStockTransferGRNId
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
