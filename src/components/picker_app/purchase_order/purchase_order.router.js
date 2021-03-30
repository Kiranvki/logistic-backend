// user controller 
const ctrl = require('./purchase_order.controller');

// custom joi validation
const {
  joiPoIdValidation,
  poList
} = require('./purchase_order.validators');

// hooks 
const {
  isInvoiceGenerated, // check whether the invoice is already generated
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
    closed.route('/purchaseOrder').get(
      [poList], // joi validation
      
      verifyAppToken, // verify app user token 
      ctrl.getPOList // post controller 
    );

    // getting  invoice details
    closed.route('/purchaseOrder/:poId').get(
    [joiPoIdValidation], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      // verifyAppToken, // verify app user token 
      ctrl.getPODetails // post controller 
    );
    // getting  invoice details
    closed.route('/purchaseOrder/startPickup/:poId').get(
      [joiPoIdValidation], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      // verifyAppToken, // verify app user token 
      ctrl.startPickUP // post controller 
    );
    closed.route('/purchaseOrder/vendorDetails/:poId').get(
      [joiPoIdValidation], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      // verifyAppToken, // verify app user token 
      ctrl.vendorDetails // post controller 
    );
  };
}

module.exports = purchaseOrderRoutes();
