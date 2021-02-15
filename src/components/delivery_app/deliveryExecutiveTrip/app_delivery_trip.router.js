const ctrl = require('./app_delivery_trip.controller');

const { createTripVal } = require('./app_delivery_trip.validators')
 

// auth 
const { verifyAppToken  } = require('../../../hooks/app/Auth');
// auth 
const { verifyUserToken } = require('../../../hooks/Auth');
const { getAllCheckInVehicleDetails } = require('../../../hooks');

function tripsRoutes() {
    //open, closed
    return (open, closed) => {

    closed.route('/get-trip/:deid').get(
        // verifyAppToken, 
        ctrl.getTripByDeliveryExecutiveId 
      );

      closed.route('/get-trip/detail/:tripid').get(
        // verifyAppToken, 
        ctrl.getTripByDeliveryTripId 
      );

      // post 
  

    };
    
    

};



module.exports = tripsRoutes();
