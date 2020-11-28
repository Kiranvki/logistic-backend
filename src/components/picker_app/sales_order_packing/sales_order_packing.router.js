// user controller 
const ctrl = require('./sales_order_packing.controller');

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
} = require('./sales_order_packing.validators');

// hooks 
const {
  setupDataForGoFrugalApi, // setup the gofrugal api
  getTheDetailsFromGoFrugal, // get the details from go frugal

  // isValidCustomer, // check whether the customer is valid or not 
  // setupDataForTallyOtherApi, // setup data for tally api
  // readCsvForCustomerDataSync, // read tally csv data for customer data sync 
  // getCustomerIdsBasedOnFiltering, // get the customer ids based on filtering 
  // getTheCustomerDetailsAsPerType, // get the customer details as per the type 
  // getTheOtherDetailsFromTallyServer, // get the details from the tally server 
  // checkWhetherCustomerListIsAlreadySyncing, // check whether customer list is already syncing 
  // getAllTheInvoicesAndRefreshAsPerThePaymentReceived, // get all invoices and refresh as per the payment received
} = require('../../../hooks');

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


    // get picker Boy details 
    closed.route('/user/details').get(
      verifyAppToken, // verify app user token 
      ctrl.getUserDetails // controller function 
    );


    // sync with goFrugal  
    closed.route('/sales-order/to-do').get(
      verifyAppToken,
      ctrl.getSalesOrder // get controller 
    );

    /*
    
        // sync with goFrugal  
        closed.route('/goFrugal/sync').get(
          verifyUserToken, // verify user access token
          checkWhetherCustomerListIsAlreadySyncing, // check whether the data is already syncing or not 
          setupDataForGoFrugalApi, // setup data for gofrugal
          getTheDetailsFromGoFrugal, // get the data from go frugal 
          ctrl.syncWithGoFrugal // get controller 
        );
    
        // post 
        closed.route('/:customerId').get(
          [joiCustomerGet], // joi validation
          verifyUserToken, // verify user token
          isValidCustomer, // check whether the customer is valid or not
          ctrl.getCustomerDetails // get controller 
        );
    
        // get all 
        closed.route('/').post(
          [joiCustomersList], // joi validation
          verifyUserToken, // verify user token
          getCustomerIdsBasedOnFiltering, // get the customer ids based on filtering 
          ctrl.getList // get controller 
        );
    
        // get minified list
        closed.route('/minified/list').get(
          [joiCustomersList], // joi validation
          verifyUserToken, // verify user token
          ctrl.getMinifiedList // get controller 
        );
    
        // get minified list
        open.route('/minified/list/city/:city').get(
          [joiCustomersList], // joi validation
          // verifyUserToken, // verify user token
          ctrl.getMinifiedList // get controller 
        );
    
        // get the payment for each and every customer 
        open.route('/tally/sync/:type/city/:city').get(
          [joiTallySync], // joi validation
          setupDataForTallyOtherApi, // setup data for gofrugal
          getTheOtherDetailsFromTallyServer, // get the data from go frugal 
          ctrl.syncWithTallyOthers // get controller 
        );
    
        // tally csv upload 
        closed.route('/tally/sync/city/:city/type/:type/upload-csv').post(
          multipartMiddleware.single('file'), // multer middleware
          [joiTallyUpload], // joi validation
          readCsvForCustomerDataSync, // fetch the data from the csv file
          ctrl.syncWithTallyOthers // get controller 
        );
    
        // invoice payment sync 
        open.route('/tally/invoice-payment/refresh/city/:city').get(
          [joiInvoicePaymentRefresh], // joi validation
          getAllTheInvoicesAndRefreshAsPerThePaymentReceived, // fetch the data from the csv file
        );
    
        // customer invoices / debit / credit / payment 
        closed.route('/:customerId/:type').get(
          [joiGetCustomerOther], // joi get customer other details joi validation
          verifyUserToken, // verify user token
          isValidCustomer, // check whether the customer is valid or not
          getTheCustomerDetailsAsPerType, // get the customer details as per type
          ctrl.getCustomerOtherDetails // get customer other details 
        )
    
        */
  };
}

module.exports = userRoutes();
