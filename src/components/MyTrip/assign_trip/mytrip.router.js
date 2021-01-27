const ctrl = require('./mytrip.controller');

const { createTripVal } = require('./mytrip.validators')

// auth 
const { verifyAppToken  } = require('../../../hooks/app/Auth');
const { getAllCheckInVehicleDetails } = require('../../../hooks');

function tripsRoutes() {
    //open, closed
    return (open, closed) => {

    closed.route('/getSalesOrder').get(
        // verifyAppToken, 
        ctrl.getSalesOrders 
      );

      // post 
    closed.route('/').post(
      [createTripVal], // joi validation
      // verifyUserToken, // verify user token
      ctrl.createTrip // controller function 
    );

    closed.route('/getItem/:invoiceNo').get(
      // verifyUserToken, // verify user token
      ctrl.getItemsByInvoiceId
    );

    closed.route('/getAvailableVehicle').get(
      // verifyUserToken, // verify user token,
      getAllCheckInVehicleDetails,
      ctrl.vehicleCountAndDetails
    )

    };
    
    

};



module.exports = tripsRoutes();
