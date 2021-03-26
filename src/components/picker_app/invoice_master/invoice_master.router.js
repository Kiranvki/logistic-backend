// user controller 
const ctrl = require('./invoice_master.controller');
// library
const multer = require('multer');
const multipartMiddleware = multer();

// custom joi validation
const {
joiGenerateInvoice,
joiGetInvoiceDetails
} = require('./invoice_master.validators');

// hooks 
const {
  checkFullfilmentStatus,
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
function invoiceRoutes() {
  //open, closed
  return (open, closed) => {

    // generating invoice
    closed.route('/invoice/:pickerBoySalesOrderMappingId').get(
      [joiGenerateInvoice], // joi validation
      isInvoiceGenerated, // check whether the invoice is already generated
      // verifyAppToken, // verify app user token 
      // checkFullfilmentStatus
      ctrl.generateInvoice // post controller 
    );


    // getting  invoice details
    closed.route('/invoice-details/:invoiceId').get(
      [joiGetInvoiceDetails], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      // verifyAppToken, // verify app user token 
      ctrl.getInvoiceDetails // post controller 
    );
  };
}

module.exports = invoiceRoutes();
