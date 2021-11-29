// auth
const ctrl = require("./vehicleEntry.controller");
const { verifySecurityAppToken } = require("../../../hooks/app/Auth");
const {
  isSecurityGuardUserCheckedIn, // is security guard checked in
} = require("../../../hooks/app");
const {
  joiVehicleList,
  joiTripId,
  joiId,
  joiInvoiceId,
} = require("./vehicleEntry.validator");
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
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.entryVehicleList // controller function
    );

    //get details of a entry vehicle
    closed.route("/vehicle/entryVehicleTripDetails/:tripId").get(
      joiTripId, //verify the input format
      verifySecurityAppToken, // verify app user token
      getAllCheckInVehicleDetails,
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.entryVehicleDetails // controller function
    );

    closed.route("/vehicle/updateCrates/:salesorderId").patch(
      joiId, //verify the input format
      verifySecurityAppToken, //verify app user token
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.updateCratesQuantity //controller function
    );

    // verify the invoice
    closed.route("/vehicle/verify-invoice/:invoiceId").post(
      verifySecurityAppToken, //verify app user token
      joiInvoiceId,
      isValidInvoice, //verify if invoice exists or not
      isInvoiceAlreadyVerified, //verify if invoice is verified
      isSecurityGuardUserCheckedIn, // is security guard checked in
      ctrl.verifyDeliveredInvoice // controller function
    );
  };
}

module.exports = vehicleRoutes();
