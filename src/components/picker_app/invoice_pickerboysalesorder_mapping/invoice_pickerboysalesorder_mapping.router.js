// user controller 
const ctrl = require('./invoice_pickerboysalesorder_mapping.controller');

// library
const multer = require('multer');
const multipartMiddleware = multer();

// custom joi validation
const {
  joiCustomerGetDetails, //joi get customer details
  joiTallySync, // joi tally sync
  joiTallyUpload, // joi tally upload 
  joiCustomerGet, // joi customer get 
  joiGoFrugalSync, // sync data with gofrugal 
  joiCustomersList, // get the list of customers in db
  joiGetCustomerOther, // get customer other details 
  joiInvoicePaymentRefresh, // joi invoice payment sync 
} = require('./invoice_pickerboysalesorder_mapping.validators');

// hooks 
const {
  isValidSalesOrder    // check is valid sales order id 
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


  };
}

module.exports = userRoutes();
