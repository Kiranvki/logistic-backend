// user controller 
const ctrl = require('./pickerboy_salesorder_mapping.controller');

// library
const multer = require('multer');
const multipartMiddleware = multer();

// custom joi validation
const {
  joiCustomerGetDetails, //joi get customer details
  joiStartPickSalesOrder, // joi start pick sales order
  joiTallyUpload, // joi tally upload 
  joiCustomerGet, // joi customer get 
  joiGoFrugalSync, // sync data with gofrugal 
  joiCustomersList, // get the list of customers in db
  joiGetCustomerOther, // get customer other details 
  joiInvoicePaymentRefresh, // joi invoice payment sync 
} = require('./pickerboy_salesorder_mapping.validators');

// hooks 
const {
  isValidSalesOrder,  // check is valid sales order id 
  isAlreadyAddedInPickingState, // check whether the salesOrderId is already added into the picker state
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


    // get picker Boy details 
    closed.route('/user/details').get(
      verifyAppToken, // verify app user token 
      ctrl.getUserDetails // controller function 
    );

    // get customer details 
    closed.route('/customer/details/:customerId/city/:cityId').get(
      [joiCustomerGetDetails], // joi validation
      verifyAppToken, // verify app user token 
      ctrl.getCustomerDetails // controller function 
    );

    // get the todays task sales order for today
    closed.route('/sales-order/todays-task').get(
      verifyAppToken,
      ctrl.getToDoSalesOrder // get controller 
    );

    // get the single sale order details
    closed.route('/sales-order/:saleOrderId').get(
      verifyAppToken,
      isValidSalesOrder,
      ctrl.getSalesOrder // get controller 
    );

    // add the salesorder in the packing stage
    closed.route('/sales-order/start-pick/:saleOrderId').patch(
      [joiStartPickSalesOrder], // joi validation
      verifyAppToken,  // verify app token
      isValidSalesOrder, //check whether the valid salesOrder Id
      isAlreadyAddedInPickingState, // check whether the salesOrderId is already added into the picker state
      ctrl.pickingState // get controller 
    );

    // once we have started picking then get the salesorder data for adding the item.
    closed.route('/sales-order/scan-order/:pickerBoySalesOrderMappingId').get(
      verifyAppToken,
      //  isValidSalesOrder,
      ctrl.scanState // get controller 
    );

    // view order basket api
    closed.route('/sales-order/view-order-basket/:pickerBoySalesOrderMappingId').get(
      verifyAppToken,
      //   isValidSalesOrder,
      ctrl.viewOrderBasket // get controller 
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
