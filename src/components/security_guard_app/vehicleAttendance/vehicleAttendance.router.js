// auth
const ctrl = require("./vehicleAttendance.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const {
  joiVehicleList,
  joiVehicleId,
} = require("./vehicleAttendance.validator");
const {
  isAlreadyCheckedIn,
  isVehicleCheckedIn,
  getAllCheckInVehicleDetails,
} = require("../../../hooks");

// exporting the vehicle routes
function vehicleRoutes() {
  //open, closed
  return (open, closed) => {
    //search a vehicle for checkin
    closed.route("/vehicle/vehicle-list").get(
      joiVehicleList,
      verifySecurityAppToken, // verify app user token
      ctrl.getAllVehicleListToCheckIn // controller function
    );

    //get a list of checked in vehicles
    closed.route("/vehicle/vehicle-waiting-list").get(
      joiVehicleList,
      verifySecurityAppToken, // verify app user token
      getAllCheckInVehicleDetails,
      ctrl.checkedInVehicles // controller function
    );

    //get details of a checked in vehicle
    closed.route("/vehicle/vehicleDetails/:vehicleId").get(
      joiVehicleId,
      verifySecurityAppToken, // verify app user token
      getAllCheckInVehicleDetails,
      ctrl.checkedInVehicleDetais // controller function
    );

    //check-in a vehicle
    closed.route("/vehicle/check-in/:vehicleId").post(
      verifySecurityAppToken, // verify app user token
      isAlreadyCheckedIn,
      ctrl.checkInVehicle // controller function
    );

    //check-out a vehicle
    closed.route("/vehicle/check-out/:vehicleId").post(
      verifySecurityAppToken, // verify app user token
      isVehicleCheckedIn,
      ctrl.checkOutVehicle // controller function
    );
  };
}

module.exports = vehicleRoutes();
