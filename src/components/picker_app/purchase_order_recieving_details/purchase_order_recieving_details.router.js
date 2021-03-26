// user controller 
const ctrl = require('./purchase_order_recieving_details.controller');
const poCtrl = require('../purchase_order/purchase_order.controller');

// library
const multer = require('multer');
const multipartMiddleware = multer();

// custom joi validation
const {
  startRecieving,
  joiRecievingList,
  joiRecievingItem
} = require('./purchase_order_recieving_details.validators');

// hooks 
const {
  isValidPoId,
  poRecievingInitiationValidations
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
    closed.route('/purchaseOrder/start-recieving/:poId').get(
      [startRecieving], // joi validation
      verifyAppToken, // verify app user token 
      isValidPoId, // check whether the poId is valid
      poRecievingInitiationValidations,
      ctrl.startPickUP // post controller 
    );
    // getting  invoice details
    closed.route('/purchaseOrder/recieving-list/:poRecievingId').get(
      [joiRecievingList], // joi validation
      verifyAppToken, // verify app user token 
      // isValidPoRecievingId, // check whether the poId is valid
      ctrl.poRecievingList // post controller 
    );
    closed.route('/purchaseOrder/recieveItem/:itemId').post(
      [joiRecievingItem], // joi validation
      verifyAppToken, // verify app user token 
      // isValidInputs, // check whether the poId is valid
      ctrl.recievePOItem // post controller 
    );
    closed.route('/purchaseOrder/basket-List/:poRecievingId').get(
      [joiRecievingList], // joi validation
      verifyAppToken, // verify app user token 
      // isValidPoId, // check whether the poId is valid
      // isValidInputs, // check whether the poId is valid
      ctrl.basketList // post controller 
    );
  };
}

module.exports = purchaseOrderRoutes();
