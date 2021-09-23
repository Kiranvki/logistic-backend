// auth
const ctrl = require("./vehicleAttendance.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const { joiVehicleList } = require('./vehicleAttendance.validator');
const {isAlreadyCheckedIn, isVehicleCheckedIn} = require('../../../hooks')


// exporting the vehicle routes
function vehicleRoutes() {
  //open, closed
  return (open, closed) => {
 
    closed.route("/vehicle/vehicle-list").get(
      joiVehicleList,
      // verifySecurityAppToken, // verify app user token
      ctrl.getAllVehicleListToCheckIn // controller function
    );

    //check-in a vehicle
    closed.route("/vehicle/check-in/:vehicleId").post(
      // verifySecurityAppToken, // verify app user token
      isAlreadyCheckedIn,
      ctrl.checkInVehicle // controller function
    );

    //check-out a vehicle
    closed.route("/vehicle/check-out/:vehicleId").post(
      // verifySecurityAppToken, // verify app user token
      isVehicleCheckedIn,
      ctrl.checkOutVehicle // controller function
    );
  };
}

module.exports = vehicleRoutes();
