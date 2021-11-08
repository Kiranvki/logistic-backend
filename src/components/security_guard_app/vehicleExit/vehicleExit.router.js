// auth
const ctrl = require("./vehicleExit.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const { isValidGpn } = require("../../../hooks");

const { joiVehicleList } = require("./vehicleExit.validator");

// exporting the vehicle routes
function vehicleRoutes() {
  //open, closed
  return (open, closed) => {
    //get vehicle list on trip
    closed.route("/trip/vehicle-list").get(
      joiVehicleList,
      verifySecurityAppToken, // verify app user token
      ctrl.getTripByVehicleNumber // controller function
    );

    //get trip details for a tripId
    closed.route("/trip/trip-details/:tripId").get(
      verifySecurityAppToken, // verify app user token
      ctrl.getTripDetailsByTripId // controller function
    );

    // get details by gpn
    closed.route("/trip/scan-gpn/:gpn").get(
      verifySecurityAppToken, // verify app user token
      isValidGpn,
      ctrl.getGpnDetails // controller function
    );

    // verify the gpn
    closed.route("/trip/verify-gpn/:gpn").post(
      verifySecurityAppToken, //verify app user token
      isValidGpn,
      ctrl.verifyGpn // controller function
    );

    closed.route("/trip/history/:type").get(
      verifySecurityAppToken, //verify app user token
      ctrl.getTripHistoryList // controller function
    );

    closed.route("/trip/historyDetails/:tripId").get(
      // verifySecurityAppToken, // verify app user token
      ctrl.getTripHistoryDetails // controller function
    );

    closed.route("/trip/allow-vehicle/:tripId").post(
      verifySecurityAppToken, // verify app user token
      ctrl.allowVehicle // controller function
    );
  };
}

module.exports = vehicleRoutes();
