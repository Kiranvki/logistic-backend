// Controller
const stiReceivingDetailsCtrl = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in_receiving_details/stock_transfer_in_receiving_details.controller");

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
    info("Check whether the sales order is already added in picking state");
    let objectId = mongoose.Types.ObjectId; // object id
    let stiId = req.params.stiId; // get the sale order id

    // mongoose valid id
    if (objectId.isValid(stiId)) {
      // check whether the sale Order id is already added or not
      let stiDetails = await stiReceivingDetailsCtrl.getSTIReceivingDetails(stiId);
      //send error based on record
      // if purchase order Id is not added
      if ((stiDetails.success, stiDetails.data && stiDetails.data.length)) {
        if (
          stiDetails.data[0].receivingStatus == 4 ||
          stiDetails.data[0].receivingStatus == 3
        ) {
          error("Purchase Order already added to receiving state");
          return Response.errors(
            req,
            res,
            StatusCodes.HTTP_CONFLICT,
            MessageTypes.stockTransferIn.stiAlreadyAddedInReceivingState
          );
        }
        error("Purchase Order already added to receiving state");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.stockTransferIn.stiGRNalreadygenerated
        );
      } else {
        next();
      }
    } else {
      error("The PickerBoy purchase order Mapping Id is Invalid !");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.stockTransferIn.invalidPickerBoyStockTransferMappingId
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
