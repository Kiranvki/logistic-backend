// auth
const ctrl = require("./disputes.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const {
  joiDisputesList,
  joiDisputeId,
  joiInvoiceNo,
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
      ctrl.getDisputes // controller function
    );

    closed.route("/disputes/disputeDetails/:disputeId").get(
      joiDisputeId,
      verifySecurityAppToken, // verify app user token
      ctrl.getDisputeDetails // controller function
    );

    closed.route("/disputes/scan-gpn/:gpn").get(
      verifySecurityAppToken, //verify app user token
      ctrl.scanReturnGpn // controller function
    );

    closed.route("/disputes/getMinifiedList/:invoiceId").get(
      joiInvoiceNo,
      verifySecurityAppToken, //verify app user token
      ctrl.getDisputeItemsMinifiedList // controller function
    );

    closed.route("/disputes/notifyDispute/:invoiceId").patch(
      joiDisputeId,
      verifySecurityAppToken, // verify app user token
      ctrl.notifyDispute // controller function
    );

    closed.route("/disputes/updateDisputeDetails/:disputeId").patch(
      joiDisputeId,
      verifySecurityAppToken, //verify app user token
      ctrl.updateDisputeDetails //controller function
    );

    closed.route("/disputes/itemDetails/:invoiceId/:itemId").get(
      verifySecurityAppToken, //verify app user token
      ctrl.getReturnedItemDetails // controller function
    );
  };
}

module.exports = vehicleRoutes();
