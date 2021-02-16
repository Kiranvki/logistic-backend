const ctrl = require('./app_delivery_trip.controller');

const { createTripVal } = require('./app_delivery_trip.validators')
 

// auth 
// const { verifyAppToken  } = require('../../../hooks/delivery-executive/Auth/verifyAppToken');
// auth 
const { verifyUserToken } = require('../../../hooks/Auth');
const { getAllCheckInVehicleDetails } = require('../../../hooks');



function tripsRoutes() {
    //open, closed
    return (open, closed) => {

    closed.route('/get-trip/:deid').get(
      // verifyAppToken, // verify app token
        ctrl.getTripByDeliveryExecutiveId 
      );

      closed.route('/get-trip/detail/:tripid').get(
        // verifyAppToken, // verify app token
        ctrl.getTripByDeliveryTripId 
      );

      // post 
      // type orderid
      closed.route('/orderdetail/:type/:orderid').get(
        // verifyAppToken, // verify app token
        ctrl.getOrderDetails 
      );


      // closed.route('/orderdetail/:type/:orderid').post(
      //   // verifyAppToken, // verify app token
      //   ctrl.getOrderDetails 
      // );

      closed.route('/orderdetail/update/:deid/:type/:orderid').post(
        // verifyAppToken, // verify app token
        ctrl.updateOrderStatus 
      );

      closed.route('/trip/generategpn').post(
        // verifyAppToken, // verify app token
        ctrl.generateGpnNumber 
      );

      

    };
    
    

};



module.exports = tripsRoutes();
