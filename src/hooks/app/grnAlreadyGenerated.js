// Controller
const poGrnController = require("../../components/picker_app/external_purchase_order/purchase_orderGRN/purchase_orderGRN.controller");

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
    info("Check whether the GRN already generated for PO");
    let objectId = mongoose.Types.ObjectId; // object id
    let poReceivingId = req.params.poReceivingId; // get the sale order id

    // mongoose valid id
    if (objectId.isValid(poReceivingId)) {
      // check whether the sale Order id is already added or not
      let poGrnDetails = await poGrnController.get({
        poReceivingId: poReceivingId,
        status:1,
        isDeleted:0
      });

      // if sales order Id is not added
      if (poGrnDetails.success && !poGrnDetails.recordNotFound) {
        error("Purchase order GRN already generated");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.purchaseOrder.grnAlreadyGenerated
        );
      }
      if (poGrnDetails.recordNotFound) {
        next();
      } else {
        info("Something went wrong");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.purchaseOrder.invalidPurchaseOrderReceivingId
        );
      }
    } else {
      error("The PickerBoy SalesOrder Mapping Id is Invalid !");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.purchaseOrder.invalidPurchaseOrderReceivingId
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
