// user controller 
const ctrl = require('./pickerboy_salesorder_mapping.controller');

// library
const multer = require('multer');
const multipartMiddleware = multer();

// custom joi validation
const {
  joiCustomerGetDetails, //joi get customer details
  joiStartPickSalesOrder, // joi start pick sales order
  joiSalesOrderDetails, // joi sales order details
  joiScanSalesOrder, // joi scan order
  joiViewOrderBasket,  // joi view order basket
  joiOngoingDelivery, // joi ongoing sales order details
  joiPendingDelivery, //  joi pending SO
  joiHistoryOfSO, // joi history of SO
 
} = require('./pickerboy_salesorder_mapping.validators');

// hooks 
const {
  isValidSalesOrder,  // check is valid sales order id 
  isAlreadyAddedInPickingState, // check whether the salesOrderId is already added into the picker state
  checkWhetherItsAValidPickerUpdate, //check whether its a valid picker profile update

  checkIsInPickingState
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

    // update picker Boy details 
    closed.route('/user/update').patch(
      verifyAppToken, // verify app user token 
      checkWhetherItsAValidPickerUpdate,//check whether its a valid picker profile update
      ctrl.updatetUserDetails // update user details
    );

    // get customer details 
    closed.route('/customer/details/:customerId').get(
      [joiCustomerGetDetails], // joi validation
      verifyAppToken, // verify app user token 
      ctrl.getCustomerDetails // controller function 
    );

    // get the todays task sales order for today
    // salesorders,stocksales,spotsales,assetTransfer 

    // closed.route('/:type/todays-task').get(
    //   verifyAppToken,   // verify app token
    //   ctrl.getToDoSalesOrder // get controller 
    // );

    closed.route('/:type/todays-task').get(
      verifyAppToken,   // verify app token
      checkIsInPickingState,
      ctrl.getTodaysOrder // get controller 
    );

    // closed.route('/purchaseorder').get(
    //   // verifyAppToken,   // verify app token
    //   // checkIsInPickingState,
    //   ctrl.getTodaysPurchaseOrder // get controller 
    // );



    

    // get the single sale order details
    closed.route('/:type/detail/:orderId').get(
      [joiSalesOrderDetails],
      // verifyAppToken,   // verify app token
      // isValidSalesOrder,
      ctrl.getOrderDetails // get controller 
    );

    // get the single sale order details
    closed.route('/:type/update/deliverydate/:orderno').patch(
      // [joiSalesOrderDetails],
      verifyAppToken,   // verify app token
      // isValidSalesOrder,
      ctrl.updateDeliveryDate // get controller 
    );

    closed.route('/:type/getdetail/:orderId').get(
      [joiSalesOrderDetails],
      // verifyAppToken,   // verify app token
      // isValidSalesOrder,
      ctrl.getSalesOrder // get controller 
    );




    // add the salesorder in the packing stage
    closed.route('/:type/start-pick/:saleOrderId').patch(
      [joiStartPickSalesOrder], // joi validation
      verifyAppToken,  // verify app token
      isValidSalesOrder, //check whether the valid salesOrder Id
      isAlreadyAddedInPickingState, // check whether the salesOrderId is already added into the picker state
      ctrl.pickingState // get controller 
    );

    // once we have started picking then get the salesorder data for adding the item.
    closed.route('/sales-order/scan-order/:pickerBoySalesOrderMappingId').get(
      [joiScanSalesOrder], //joi scan order
      verifyAppToken,  // verify app token
      //  isValidSalesOrder,
      ctrl.scanState // get controller 
    );

    // view order basket api
    closed.route('/sales-order/view-order-basket/:pickerBoySalesOrderMappingId').get(
      [joiViewOrderBasket],
      verifyAppToken,   // verify app token
      //   isValidSalesOrder,
      ctrl.viewOrderBasket // get controller 
    );

    // get the ongoing SO/invoice status
    closed.route('/on-going').get(
      [joiOngoingDelivery], // joi ongoing delivery
      verifyAppToken,   // verify app token
      ctrl.onGoingOrders // ongoing SO/invoice status
    );

    // get the pending invoice status
    closed.route('/pending').get(
      [joiPendingDelivery], // joi pending SO
      verifyAppToken,   // verify app token
      ctrl.getPendingSalesOrder // ongoing SO/invoice status
    );

    // get the invoice detail by invoice mongo id
    closed.route('/invoice/:type/:invId').get(
      // [joiGetInvValidate]
      // joi history SO
      verifyAppToken,   // verify app token
      ctrl.getInvoiceDocumentDetail // history SO/invoice status
    );


    // get the history invoice status
    closed.route('/history').get(
      [joiHistoryOfSO], // joi history SO
      verifyAppToken,   // verify app token
      ctrl.getOrderHistoryByPickerBoyID
      // getHistoryOfSalesOrder // history SO/invoice status
    );
    closed.route('/history/:type/invoices/:orderid').get(
      [joiHistoryOfSO], // joi history SO
      // verifyAppToken,   // verify app token
      ctrl.getOrderHistoryAndInvoices
      // getHistoryOfSalesOrder // history SO/invoice status
    );



    open.route('/list/invoice-open').get(
     
      // verifyAppToken,   // verify app token
      ctrl.getInvoices

      // getHistoryOfSalesOrder // history SO/invoice status
    );


  };
}

module.exports = userRoutes();
