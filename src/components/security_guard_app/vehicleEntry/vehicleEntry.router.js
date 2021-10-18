// auth
const ctrl = require("./vehicleEntry.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const {
  joiVehicleList,
  joiVehicleId,
} = require("./vehicleEntry.validator");
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
    closed.route("/vehicle/entry-vehicle-list").get(
      joiVehicleList,
      // verifySecurityAppToken, // verify app user token
      ctrl.entryVehicleList // controller function
    );


    //get details of a entry vehicle
    closed.route("/vehicle/entryVehicleTripDetails/:tripId").get(
      // verifySecurityAppToken, // verify app user token
      // getAllCheckInVehicleDetails,
      ctrl.entryVehicleDetails // controller function
    ); 

  };
}

module.exports = vehicleRoutes();
