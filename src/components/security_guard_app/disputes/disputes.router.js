// auth
const ctrl = require("./disputes.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const {
  isSecurityGuardUserCheckedIn, // is security guard checked in
} = require("../../../hooks/app");
const {
  joiDisputesList,
  joiDisputeId,
  joiInvoiceId,
  joiId,
} = require("./disputes.validator");

// exporting the vehicle routes
function vehicleRoutes() {
  //open, closed
  return (open, closed) => {
    // get disputes list
    closed.route("/disputes/disputes-list").get(
      joiDisputesList,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getDisputes // controller function
    );

    closed.route("/disputes/disputeDetails/:disputeId").get(
      joiDisputeId,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getDisputeDetails // controller function
    );

    closed.route("/disputes/getPODDisputeDetails/:disputeId").get(
      joiDisputeId,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getPODDisputeDetails // controller function
    );

    closed.route("/disputes/scan-gpn/:gpn").get(
      verifySecurityAppToken, //verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.scanReturnGpn // controller function
    );

    closed.route("/disputes/getMinifiedList/:invoiceId").get(
      joiInvoiceId,
      verifySecurityAppToken, //verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getDisputeItemsMinifiedList // controller function
    );

    closed.route("/disputes/notifyDispute/:invoiceId").patch(
      joiInvoiceId,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.notifyDispute // controller function
    );

    closed.route("/disputes/updateDisputeDetails/:disputeId").patch(
      joiDisputeId,
      verifySecurityAppToken, //verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.updateDisputeDetails //controller function
    );

    closed.route("/disputes/itemDetails/:invoiceId/:itemId").get(
      verifySecurityAppToken, //verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getReturnedItemDetails // controller function
    );

    closed.route("/disputes/updatedDisputeDetails/:invoiceId").get(
      joiInvoiceId,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getUpdatedDisputeDetails // controller function
    );

    closed
      .route("/disputes/salesReturnDetails/invoice/:invoiceId/item/:itemId")
      .get(
        joiInvoiceId,
        verifySecurityAppToken, // verify app user token
        isSecurityGuardUserCheckedIn, // is security guard checked in
        ctrl.getsaleReturnDetails // controller function
      );
  };
}

module.exports = vehicleRoutes();
