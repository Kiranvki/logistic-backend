// auth
const ctrl = require("./vehicleEntry.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const { joiVehicleList, joiTripId, joiId, joiInvoiceNo } = require("./vehicleEntry.validator");
const {
  isAlreadyCheckedIn,
  isVehicleCheckedIn,
  getAllCheckInVehicleDetails,
  isValidInvoice,
  isInvoiceAlreadyVerified,
} = require("../../../hooks");

// exporting the vehicle routes
function vehicleRoutes() {
  //open, closed
  return (open, closed) => {
    //search a vehicle for checkin
    closed.route("/vehicle/entry-vehicle-list").get(
      joiVehicleList,
      verifySecurityAppToken, // verify app user token
      ctrl.entryVehicleList // controller function
    );

    //get details of a entry vehicle
    closed.route("/vehicle/entryVehicleTripDetails/:tripId").get(
      joiTripId, //verify the input format
      verifySecurityAppToken, // verify app user token
      getAllCheckInVehicleDetails,
      ctrl.entryVehicleDetails // controller function
    );

    closed.route("/vehicle/updateCrates/:id").patch(
      joiId, //verify the input format
      verifySecurityAppToken, //verify app user token
      ctrl.updateCratesQuantity //controller function
    );

    // verify the invoice
    closed.route("/vehicle/verify-invoice/:invoiceNo").post(
      joiInvoiceNo,
      // verifySecurityAppToken, //verify app user token
      isValidInvoice, //verify if invoice exists or not
      isInvoiceAlreadyVerified,//verify if invoice is verified 
      ctrl.verifyDeliveredInvoice // controller function
    );
  };
}

module.exports = vehicleRoutes();
