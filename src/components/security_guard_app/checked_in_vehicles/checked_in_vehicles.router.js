// auth
const ctrl = require("./checked_in_vehicles.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const {
  isSecurityGuardUserCheckedIn, // is security guard checked in
} = require("../../../hooks/app");

// exporting the vehicle routes
function vehicleRoutes() {
  //open, closed
  return (open, closed) => {
    // get all checked-in vehicle details
    closed.route("/vehicle/checkedinvehicles").get(
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.checkedInVehicles // controller function
    );

    // get details of one checked-in vehicle
    closed.route("/vehicle/checkedinvehicle").get(
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.checkedInVehicle // controller function
    );

    //get details of a vehicle
    closed.route("/vehicle/vehicledetail").get(
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.vehicledetails // controller function
    );

    //check-in a vehicle
    closed.route("/vehicle/checkin").post(
      verifySecurityAppToken, // verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.vehicleCheckIn // controller function
    );
  };
}

module.exports = vehicleRoutes();
