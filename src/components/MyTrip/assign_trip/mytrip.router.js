const ctrl = require('./mytrip.controller');

const { createTripVal, createSpotSalesVal, createOnSpotSaleVal } = require('./mytrip.validators')

// auth 
const { verifyAppToken  } = require('../../../hooks/app/Auth');
// auth 
const { verifyUserToken } = require('../../../hooks/Auth');
const { getAllCheckInVehicleDetails } = require('../../../hooks');

function tripsRoutes() {
    //open, closed
    return (open, closed) => {

    closed.route('/getSalesOrder').get(
        verifyAppToken, 
        ctrl.getSalesOrders 
      );

      // post 
    closed.route('/').post(
      [createTripVal], // joi validation
      verifyUserToken, // verify user token
      ctrl.createTrip // controller function 
    );

    closed.route('/getItem/:invoiceNo').get(
      verifyUserToken, // verify user token
      ctrl.getItemsByInvoiceId
    );

    closed.route('/getAvailableVehicle').post(
      verifyUserToken, // verify user token,
      // getAllCheckInVehicleDetails,
      ctrl.vehicleCountAndDetails
    );

    closed.route('/getVehicleCount').get(
      verifyUserToken,
      ctrl.getCheckedInVehicleCount
    );

    closed.route('/getTrip').post(
      verifyUserToken,
      ctrl.getTrip
    );

    closed.route('/getSalesMan').get(
      verifyUserToken,
      ctrl.getSalesMan
    );

    closed.route('/getItemsByLocation').get(
      verifyUserToken,
      ctrl.getItemsByLocation
    );

    closed.route('/listTrips').get(
      verifyUserToken,
      ctrl.getTriplisting
    );

    closed.route('/storeOnSpotSales').post( // With trip and Vehicle allocation
      verifyUserToken,
      createOnSpotSaleVal,
      ctrl.storeOnSpotSales
    );

    closed.route('/createSpotSales').post( // Without trip and Vehicle allocation
      verifyUserToken,
      createSpotSalesVal,
      ctrl.createSpotSales
    );

    closed.route('/getSpotSalesList').get(
      verifyUserToken,
      ctrl.getSpotSalesList
    );

    closed.route('/storeAssetTransfer').get(
      verifyUserToken,
      ctrl.storeAssetTransfer
    );

    };
};



module.exports = tripsRoutes();
