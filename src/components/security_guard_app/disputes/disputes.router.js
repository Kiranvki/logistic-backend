// auth
const ctrl = require("./disputes.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const { joiDisputesList } = require("./disputes.validator");

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
      verifySecurityAppToken, // verify app user token
      ctrl.getDisputeDetails // controller function
    );

    closed.route("/disputes/scan-gpn/:gpn").get(
      verifySecurityAppToken, //verify app user token
      ctrl.scanReturnGpn // controller function
    )

    closed.route("/disputes/getMinifiedList/:invoice").get(
      verifySecurityAppToken, //verify app user token
      ctrl.getDisputeItemsMinifiedList // controller function
    )

    closed.route("/disputes/disputeDetails").post(
      verifySecurityAppToken, // verify app user token
      ctrl.notifyDispute // controller function
    );
  };
}

module.exports = vehicleRoutes();
