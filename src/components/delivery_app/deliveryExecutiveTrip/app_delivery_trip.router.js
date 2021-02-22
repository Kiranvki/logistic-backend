const ctrl = require('./app_delivery_trip.controller');

const { createTripVal } = require('./app_delivery_trip.validators')

const {
  isDeliveryExecutiveCheckedIn, // is user checked in
  isValidDeliveryId, // check whether the salesman id is valid or not
  isDeliveryAlreadyCheckedIn, // check whether the user already check In
  getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out
  deliveryGenerateMonthDaysAndOtherMetaData, // generate month days and other meta data
} = require("../../../hooks/app");

// auth
const { verifyDeliveryAppToken } = require("../../../hooks/app/Auth");
const { getAllCheckInVehicleDetails } = require('../../../hooks');



function tripsRoutes() {
    //open, closed
    return (open, closed) => {

    closed.route('/get-trip/').get(
      verifyDeliveryAppToken,
        isValidDeliveryId,
      // verifyAppToken, // verify app token
        ctrl.getTripByDeliveryExecutiveId 
      );

      closed.route('/get-trip/detail/:tripid').get(
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.getTripByTripId 
      );

      // post 
      // type orderid
      closed.route('/orderdetail/:type/:orderid').get(
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.getOrderDetails 
      );


      // closed.route('/orderdetail/:type/:orderid').post(
      //   // verifyAppToken, // verify app token
      //   ctrl.getOrderDetails 
      // );

      closed.route('/orderdetail/update/:type/:orderid').post(
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.updateOrderStatus 
      );

      closed.route('/trip/generategpn/:tripid/:type/:soid').get(
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.generateGpnNumber 
      );


      closed.route('/trip/viewinvoice').get(
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.getInvoiceByNumber 
      );

      closed.route('/trip/startodometer/:tripid').patch(
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.updateOdometerReading
      );

      closed.route('/trip/intrip').get(
        verifyDeliveryAppToken,
        isValidDeliveryId,
        
        // verifyAppToken, // verify app token
        ctrl.getInTrip
      );



      

      

      

    };
    
    

};



module.exports = tripsRoutes();
