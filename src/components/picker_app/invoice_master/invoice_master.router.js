// user controller 
const ctrl = require('./invoice_master.controller');
// library
const multer = require('multer');
const multipartMiddleware = multer();

// custom joi validation
const {
  joiTallySync, // joi tally sync
  joiTallyUpload, // joi tally upload 
  joiCustomerGet, // joi customer get 
  joiGoFrugalSync, // sync data with gofrugal 
  joiCustomersList, // get the list of customers in db
  joiGetCustomerOther, // get customer other details 
  joiInvoicePaymentRefresh, // joi invoice payment sync 
} = require('./invoice_master.validators');

// hooks 
const {
  isInvoiceGenerated, // check whether the invoice is already generated
  // isValidCustomer, // check whether the customer is valid or not 
  // setupDataForTallyOtherApi, // setup data for tally api
  // readCsvForCustomerDataSync, // read tally csv data for customer data sync 
  // getCustomerIdsBasedOnFiltering, // get the customer ids based on filtering 
  // getTheCustomerDetailsAsPerType, // get the customer details as per the type 
  // getTheOtherDetailsFromTallyServer, // get the details from the tally server 
  // checkWhetherCustomerListIsAlreadySyncing, // check whether customer list is already syncing 
  // getAllTheInvoicesAndRefreshAsPerThePaymentReceived, // get all invoices and refresh as per the payment received
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

    // getting  invoice
    closed.route('/invoice-details/:invoiceId').get(
      ///  [joiGoFrugalSync], // joi validation
      isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token 
      ctrl.generateInvoice // post controller 
    );
  };
}

module.exports = userRoutes();
