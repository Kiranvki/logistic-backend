// user controller 
const ctrl = require('./purchase_order_receiving_details.controller');
const poCtrl = require('../purchase_order/purchase_order.controller');

// library
const multer = require('multer');
const multipartMiddleware = multer();

// custom joi validation
const {
  startReceiving,
  joiReceivingList,
  joiReceivingItem
} = require('./purchase_order_receiving_details.validators');

// hooks 
const {
  isValidPoId,
  poReceivingInitiationValidations,
  hasOrderAlreadyInReceivingState,
  isValidInputsForReceivedItem
} = require('../../../hooks/app');
// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');
const {
  verifyAppToken
} = require('../../../hooks/app/Auth');

// exporting the user routes 
function purchaseOrderRoutes() {
  //open, closed
  return (open, closed) => {

   
    // getting  invoice details
    closed.route('/purchaseOrder/start-receiving/:poId').get(
      [startReceiving], // joi validation
      verifyAppToken, // verify app user token 
      isValidPoId, // check whether the poId is valid
      poReceivingInitiationValidations,
      hasOrderAlreadyInReceivingState,
      ctrl.startPickUP // post controller 
    );
    // getting  invoice details
    closed.route('/purchaseOrder/receiving-list/:poReceivingId').get(
      [joiReceivingList], // joi validation
      verifyAppToken, // verify app user token 
      // isValidPoReceivingId, // check whether the poId is valid
      ctrl.poReceivingList // post controller 
    );
    closed.route('/purchaseOrder/receive-item/:material_no').post(
      [joiReceivingItem], // joi validation
      verifyAppToken, // verify app user token 
      isValidInputsForReceivedItem, // check whether the poId is valid
      ctrl.receivePOItem // post controller 
    );
    closed.route('/purchaseOrder/basket-list/:poReceivingId').get(
      [joiReceivingList], // joi validation
      verifyAppToken, // verify app user token 
      // isValidPoId, // check whether the poId is valid
      // isValidInputs, // check whether the poId is valid
      ctrl.basketList // post controller 
    );
  };
}

module.exports = purchaseOrderRoutes();
