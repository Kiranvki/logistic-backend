// auth
const ctrl = require("./checked_in_vehicles.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");

// exporting the vehicle routes
function vehicleRoutes() {
  //open, closed
  return (open, closed) => {
    // get all checked-in vehicle details
    closed.route("/vehicle/checkedinvehicles").get(
      verifySecurityAppToken, // verify app user token
      ctrl.checkedInVehicles // controller function
    );

    // get details of one checked-in vehicle
    closed.route("/vehicle/checkedinvehicle").get(
      verifySecurityAppToken, // verify app user token
      ctrl.checkedInVehicle // controller function
    );

    //get details of a vehicle
    closed.route("/vehicle/vehicledetail").get(
      verifySecurityAppToken, // verify app user token
      ctrl.vehicledetails // controller function
    );

    //check-in a vehicle
    closed.route("/vehicle/checkin").post(
      verifySecurityAppToken, // verify app user token
      ctrl.vehicleCheckIn // controller function
    );
  };
}

module.exports = vehicleRoutes();
