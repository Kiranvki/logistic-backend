// Controller
const poCtrl = require("../../components/picker_app/external_purchase_order/purchase_order/purchase_order.controller");

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
    let StoObjectID = req.params.STOID;
    // mongoose valid id
    if (objectId.isValid(StoObjectID)) {
      // check whether the sale Order id is unique or not
      let poDetails = await poCtrl.get(StoObjectID);

      // if email is unique
      if (poDetails.success) {
        info("Valid Order");
        req.body.stoDetails = poDetails.data[0];

        next();
      } else {
        error("INVALID Order!");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.purchaseOrder
            .purchaseOrderIdInvalidEitherDeletedOrDeactivated
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
