// user controller
const ctrl = require("./purchase_orderGRN.controller");
// library
const multer = require("multer");

// custom joi validation
const {
  joigrnId,
  joipoGenerateGRN,
} = require("./purchase_orderGRN.validators");

// hooks
const {
  isValidPOReceivingId, // check whether the invoice is already generated
  isValidPogrnId,
  grnAlreadyGenerated,
  isValidPORecIdForGrnGetDetails,
  getPOFulfilmentStatusAndCheckUpcomingDeliveryDate,
  getPODetails,
  storeGRNDetailsIntoDB,
  generateGRN,
} = require("../../../../hooks/app");

// auth
const { verifyAppToken } = require("../../../../hooks/app/Auth");

// exporting the user routes
function purchaseOrderRoutes() {
  //open, closed
  return (open, closed) => {
    // generating invoice
    closed.route("/generate-grn/:poReceivingId").post(
      [joipoGenerateGRN], // joi validation
      verifyAppToken,
      grnAlreadyGenerated,
      isValidPORecIdForGrnGetDetails,
      getPODetails,
      getPOFulfilmentStatusAndCheckUpcomingDeliveryDate,
      generateGRN,
      storeGRNDetailsIntoDB,
      ctrl.updateGRNDetails // post controller
    );

    // getting  invoice details
    closed.route("/grn-details/:grnId").get(
      [joigrnId], // joi validation
      verifyAppToken,
      isValidPogrnId,
      // verifyAppToken, // verify app user token
      ctrl.grnDetails // post controller
    );
  };
}

module.exports = purchaseOrderRoutes();
