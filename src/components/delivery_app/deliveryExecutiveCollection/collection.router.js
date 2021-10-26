const ctrl = require("./collection.controller");

// const { updateDeliveryStatusVal,
//   getHistoryVal,
//   getInTripVal,
//   updateOdometerReadingVal,
//   getInvoiceVal,
//   updateOrderStatusVal,
//   getOrderDetailVal,
//   getTripByIdVal,
//   generateGpnVal,
//   joiTripId,
//   joiSoId
// } = require('./app_delivery_trip.validators')

// const {
//   isDeliveryExecutiveCheckedIn, // is user checked in
//   isValidDeliveryId, // check whether the salesman id is valid or not
//   isDeliveryAlreadyCheckedIn, // check whether the user already check In
//   getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out
//   deliveryGenerateMonthDaysAndOtherMetaData, // generate month days and other meta data
//   isActiveDelivery
// } = require("../../../hooks/app");

// auth
const { verifyDeliveryAppToken } = require("../../../hooks/app/Auth");
const { getAllCheckInVehicleDetails } = require("../../../hooks");
const joiValidation = require("../../../responses/types/joiValidation");

function collectionRoutes() {
  //open, closed
  return (open, closed) => {
    closed.route("/createNewCollection").post(
      // verifyDeliveryAppToken,
      // isValidDeliveryId,
      // isActiveDelivery,
      // verifyAppToken, // verify app token
      ctrl.createNewCollection
    );

    closed.route("/getInvoiceListByCustomer").get(
      // verifyDeliveryAppToken,
      // isValidDeliveryId,
      // isActiveDelivery,
      // verifyAppToken, // verify app token
      ctrl.getInvoiceListByCustomer
    );

    closed.route("/mapInvoicesToCollection").put(
      // verifyDeliveryAppToken,
      // isValidDeliveryId,
      // isActiveDelivery,
      // verifyAppToken, // verify app token
      ctrl.mapInvoicesToCollection
    );
    
  };
}

module.exports = new collectionRoutes();
