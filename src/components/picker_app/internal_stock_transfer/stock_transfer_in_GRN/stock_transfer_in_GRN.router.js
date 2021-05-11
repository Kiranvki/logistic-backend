// user controller
const ctrl = require("./stock_transfer_in_GRN.controller");
// custom joi validation
const {
  joigrnId,
  joistiGenerateGRN,
} = require("./stock_transfer_in_GRN.validators");

// hooks
const {
  isValidSTIReceivingId, // check whether the invoice is already generated
  isValidSTIgrnId,
  isGRNAlreadyGeneratedForSTI,
  isValidSTIRecIdForGrnGetDetails,
  getSTIFulfilmentStatusAndCheckUpcomingDeliveryDate,
  getSTIDetails,
  storeGRNDetailsIntoDB,
  generateStiGRN,
} = require("../../../../hooks/app");

// auth
const { verifyAppToken } = require("../../../../hooks/app/Auth");

// exporting the user routes
function stockTransferInRoutes() {
  //open, closed
  return (open, closed) => {
    // generating invoice
    closed.route("/:stiId/receiving-details/:stiReceivingId/generate-grn").post(
      [joistiGenerateGRN], // joi validation
      verifyAppToken,
      isGRNAlreadyGeneratedForSTI,
      isValidSTIRecIdForGrnGetDetails,
      getSTIDetails,
      getSTIFulfilmentStatusAndCheckUpcomingDeliveryDate,
      generateStiGRN,
      storeGRNDetailsIntoDB,
      ctrl.updateGRNDetails // stist controller
    );

    // getting  invoice details
    closed.route("/:stiId/receiving-details/:stiReceivingId/grn-details/:grnId").get(
      [joigrnId], // joi validation
      verifyAppToken,
      isValidSTIgrnId,
      // verifyAppToken, // verify app user token
      ctrl.grnDetails // stist controller
    );
  };
}

module.exports = stockTransferInRoutes();
