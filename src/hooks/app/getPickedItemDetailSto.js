// Controller
const stockTransferPickingCtrl = require("../../components/picker_app/external_purchase_order/stock_transfer_picking_details/stock_transfer_picking_details.controller");

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
    info("Check whether PO Id is valid or not");
    let objectId = mongoose.Types.ObjectId; // object id stoPickingId
    let StoPickingID = req.params.stoPickingId,
    item_no = req.body.item_no;
    // mongoose valid id
    
    if (objectId.isValid(StoPickingID)) {
      // check whether the sale Order id is unique or not
      let stoDetails = await stockTransferPickingCtrl.getValidPickedItem(StoPickingID);

      // if email is unique
      if (stoDetails.success) {
        info("Valid Order");
        req.body.pickedStoDetails = stoDetails.data;
        req.params.STOID = stoDetails.data.stoDbId
        next();
      } else {
        error("INVALID Order!");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.purchaseOrder
            .stoIdOrItemNoInvalidEitherDeletedOrDeactivated
        );
      }
    } else {
      error("The Order ID is Invalid !");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.purchaseOrder.invalidStoId
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
