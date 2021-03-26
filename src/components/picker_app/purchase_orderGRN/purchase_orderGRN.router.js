// user controller 
const ctrl = require('./purchase_orderGRN.controller');
// library
const multer = require('multer');

// custom joi validation
const {
  joigrnId,
  joipoRecievingId
} = require('./purchase_orderGRN.validators');

// hooks 
const {
  isValidPORecievingId, // check whether the invoice is already generated
  isValidPogrnId,
  grnAlreadyGenerated,
  isValidPORecIdForGrnGetDetails
} = require('../../../hooks/app');

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');

// auth 
const {
  verifyAppToken
} = require('../../../hooks/app/Auth');

// exporting the user routes 
function purchaseOrderRoutes() {
  //open, closed
  return (open, closed) => {

    // generating invoice
    closed.route('/purchaseOrder/generate-grn/:poRecievingId').get(
      [joipoRecievingId], // joi validation
      verifyAppToken,
      // grnAlreadyGenerated,
      isValidPORecIdForGrnGetDetails,
      // verifyAppToken, // verify app user token 
      ctrl.generateGRN // post controller 
    );

    // getting  invoice details
    closed.route('/purchaseOrder/grn-details/:grnId').get(
      [joigrnId], // joi validation
      verifyAppToken,
      isValidPogrnId,
      // verifyAppToken, // verify app user token 
      ctrl.grnDetails // post controller 
    );   
  };
}

module.exports = purchaseOrderRoutes();
