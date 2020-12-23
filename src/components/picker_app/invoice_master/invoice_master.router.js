// user controller 
const ctrl = require('./invoice_master.controller');
// library
const multer = require('multer');
const multipartMiddleware = multer();

// custom joi validation
const {

} = require('./invoice_master.validators');

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
function userRoutes() {
  //open, closed
  return (open, closed) => {

    // generating invoice
    closed.route('/invoice/:pickerBoySalesOrderMappingId').get(
      ///  [joiGoFrugalSync], // joi validation
      isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token 
      ctrl.generateInvoice // post controller 
    );


    // getting  invoice details
    closed.route('/invoice-details/:invoiceId').get(
      ///  [joiGoFrugalSync], // joi validation
      isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token 
      ctrl.generateInvoice // post controller 
    );
  };
}

module.exports = userRoutes();
