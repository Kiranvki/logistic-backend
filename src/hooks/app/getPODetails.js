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
    let objectId = mongoose.Types.ObjectId; // object id
    let poReceivingDetails = req.body.poReceivingDetails;
    // mongoose valid id
    if (objectId.isValid(poReceivingDetails.poId)) {
      // check whether the sale Order id is unique or not
      let poDetails = await poCtrl.get(poReceivingDetails.poId);

      // if email is unique
      if (poDetails.success) {
        info("Valid SaleOrder");
        req.body.poDetails = poDetails.data[0];

        next();
      } else {
        error("INVALID PurchaseOrder!");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.purchaseOrder
            .purchaseOrderIdInvalidEitherDeletedOrDeactivated
        );
      }
    } else {
      error("The PurchaseOrder ID is Invalid !");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.purchaseOrder.invalidPurchaseOrderId
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
