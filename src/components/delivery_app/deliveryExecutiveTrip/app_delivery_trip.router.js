const ctrl = require('./app_delivery_trip.controller');

const { updateDeliveryStatusVal,
  getHistoryVal,
  getInTripVal,
  updateOdometerReadingVal,
  getInvoiceVal,
  updateOrderStatusVal,
  getOrderDetailVal,
  getTripByIdVal } = require('./app_delivery_trip.validators')

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

      closed.route('/get-trip/:type/detail/:tripid').get(
        getTripByIdVal,
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.getTripByTripId 
      );

      // post 
      // type orderid
      closed.route('/orderdetail/:type/:orderid').get(
        getOrderDetailVal,
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
        updateOrderStatusVal,
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.updateOrderStatus 
      );
// validation Pending
      closed.route('/trip/generategpn/:tripid/:type/:soid').get(
        
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.generateGpnNumber 
      );





      closed.route('/trip/viewinvoice').get(
        getInvoiceVal,
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.getInvoiceByNumber 
      );

      closed.route('/trip/starttrip/:tripid').patch(
        updateOdometerReadingVal,
        verifyDeliveryAppToken,
        isValidDeliveryId,
        // verifyAppToken, // verify app token
        ctrl.updateOdometerReading
      );

      closed.route('/trip/intrip/:type').get(
        getInTripVal,
        verifyDeliveryAppToken,
        isValidDeliveryId,
        
        // verifyAppToken, // verify app token
        ctrl.getInTrip
      );


      closed.route('/trip/history/:type').get(
        getHistoryVal,
        verifyDeliveryAppToken,
        isValidDeliveryId,
        
        
        ctrl.getHistory
      );

// salesorderID
      closed.route('/trip/deliverystatus/:type/:id').post(
        updateDeliveryStatusVal,
        verifyDeliveryAppToken,
        isValidDeliveryId,
        
        
        ctrl.updateItemStatusAndCaretOut
      );


      // get Direction
// validation pending
      closed.route('/trip/getdirection').get(
        // verifyDeliveryAppToken,
        // isValidDeliveryId,
        
        
        ctrl.getDirection
      );

      
      
      

    };
    
    

};



module.exports = tripsRoutes();
