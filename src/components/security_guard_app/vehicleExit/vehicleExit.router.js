// auth
const ctrl = require("./vehicleExit.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const { isValidGpn } = require("../../../hooks");

const {
  joiVehicleList,
  joiTripId,
  joiType,
  joiTripNo,
} = require("./vehicleExit.validator");

const {
  isSecurityGuardUserCheckedIn, // is security guard checked in
} = require("../../../hooks/app");

// exporting the vehicle routes
function vehicleRoutes() {
  //open, closed
  return (open, closed) => {
    //get vehicle list on trip
    closed.route("/trip/vehicle-list").get(
      joiVehicleList,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getTripByVehicleNumber // controller function
    );

    //get trip details for a tripId
    closed.route("/trip/trip-details/:tripId").get(
      joiTripNo, // verify the format of input
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getTripDetailsByTripId // controller function
    );

    // get details by gpn
    closed.route("/trip/scan-gpn/:gpn").get(
      isValidGpn,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getGpnDetails // controller function
    );

    // verify the gpn
    closed.route("/trip/verify-gpn/:gpn").post(
      isValidGpn,
      verifySecurityAppToken, //verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.verifyGpn // controller function
    );

    closed.route("/trip/history/:type").get(
      joiType,
      verifySecurityAppToken, //verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getTripHistoryList // controller function
    );

    closed.route("/trip/historyDetails/:tripId").get(
      joiTripId,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getTripHistoryDetails // controller function
    );

    closed.route("/trip/historyTimeline/:tripId").get(
      joiTripId,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.getTripTimeline // controller function
    );

    closed.route("/trip/allow-vehicle/:tripId").post(
      joiTripNo,
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.allowVehicle // controller function
    );
  };
}

module.exports = vehicleRoutes();
