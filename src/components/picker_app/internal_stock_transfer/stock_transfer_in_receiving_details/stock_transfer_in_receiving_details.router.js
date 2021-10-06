// user controller
const ctrl = require("./stock_transfer_in_receiving_details.controller");
const stiCtrl = require("../stock_transfer_in/stock_transfer_in.controller");

// library
const multer = require("multer");
const multipartMiddleware = multer();

// custom joi validation
const {
  startReceiving,
  joiReceivingList,
  joiReceivingItem,
  joiScanItem
} = require("./stock_transfer_in_receiving_details.validators");

// hooks
const {
  isValidSTIId,
  stiReceivingInitiationValidations,
  hasSTIOrderAlreadyInReceivingState,
  isValidInputsForSTIReceivedItem,
} = require("../../../../hooks/app");
// auth
const { verifyUserToken } = require("../../../../hooks/Auth");
const { verifyAppToken } = require("../../../../hooks/app/Auth");

// exporting the user routes
function stockTransferInRoutes() {
  //open, closed
  return (open, closed) => {
    // getting  invoice details
    closed.route("/:stiId/start-receiving").get(
      [startReceiving], // joi validation
      verifyAppToken, // verify app user token
      isValidSTIId, // check whether the stiId is valid
      stiReceivingInitiationValidations,
      hasSTIOrderAlreadyInReceivingState,
      ctrl.startPickUP // stist controller
    );
    // getting  invoice details
    closed.route("/:stiId/receiving-details/:stiReceivingId").get(
      [joiReceivingList], // joi validation
      verifyAppToken, // verify app user token
      // isValidSTIReceivingId, // check whether the stiId is valid
      ctrl.stiReceivingList // stist controller
    );
    closed.route("/:stiId/receiving-details/:stiReceivingId/receive-item/:material").post(
      [joiReceivingItem], // joi validation
      verifyAppToken, // verify app user token
      isValidInputsForSTIReceivedItem, // check whether the stiId is valid
      ctrl.receiveSTIItem // stist controller
    );
    // closed.route("/scan-item/:material").stist(
    //   [joiScanItem], // joi validation
    //   verifyAppToken, // verify app user token
    //   isValidInputsForReceivedItem, // check whether the stiId is valid
    //   ctrl.receiveSTIItem // stist controller
    // );
    closed.route("/:stiId/basket-details/:stiReceivingId").get(
      [joiReceivingList], // joi validation
      verifyAppToken, // verify app user token
      // isValidSTIId, // check whether the stiId is valid
      // isValidInputs, // check whether the stiId is valid
      ctrl.basketList // stist controller
    );
  };
}

module.exports = stockTransferInRoutes();
