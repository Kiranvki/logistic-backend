// user controller 
const ctrl = require('./pickerboy_salesorder_items_mapping.controller');

// library
const multer = require('multer');
const multipartMiddleware = multer();

// custom joi validation
const {
  joiAddItem, //joi add item
  joiEditAddedItem, //joi edit item
  joiTallyUpload, // joi tally upload 
  joiCustomerGet, // joi customer get 
  joiGoFrugalSync, // sync data with gofrugal 
  joiInvValidate,
  joiCustomersList, // get the list of customers in db


} = require('./pickerboy_salesorder_items_mapping.validators');

// hooks 
const {
  isValidSalesOrder, //
  isItemAlreadyAdded, //check whether the item is already added or not
  checkWhetherItsAValidItemUpdate, // check whether its a valid item update
  // isValidCustomer, // check whether the customer is valid or not 
  // setupDataForTallyOtherApi, // setup data for tally api
  // readCsvForCustomerDataSync, // read tally csv data for customer data sync 
  // getCustomerIdsBasedOnFiltering, // get the customer ids based on filtering 
  // getTheCustomerDetailsAsPerType, // get the customer details as per the type 
  // getTheOtherDetailsFromTallyServer, // get the details from the tally server 
  // checkWhetherCustomerListIsAlreadySyncing, // check whether customer list is already syncing 
  // getAllTheInvoicesAndRefreshAsPerThePaymentReceived, // get all invoices and refresh as per the payment received
  validateOrderItemQuantity,
  getOrderItemDetail,
  getPickedItemDetail,
  generateDelivery,
  updateSapDeliveryDetail,
  generateInvoice,
  fetchInvoice,
  updateInvoiceSAPDataToDB,
  isValidItemQuantity
  
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

    // add the salesorder in the packing stage
    closed.route('/:type/add-item/:pickerBoySalesOrderMappingId').patch(
      // [joiAddItem], // joi add item
      verifyAppToken,
      isItemAlreadyAdded, // check whether the item is already added
      isValidItemQuantity,//check whether the item quantity is >0
      getOrderItemDetail,
      // validateOrderItemQuantity,
      // verifyAppToken, // verify app token
      ctrl.addItems // get controller 
    );

//generate picking allocation(delivery#) and then generate invoice for the generated delivery#
    closed.route('/generate/invoice/:pickerBoyOrderMappingId').get(  //change to patch
      // [joiInvValidate],
      getPickedItemDetail,
      // generateDelivery,
      // updateSapDeliveryDetail,
      generateInvoice,
      fetchInvoice,
      updateInvoiceSAPDataToDB,
      ctrl.generateInv
      // ctrl.getPickedItemByPickerOrderId
      
    );

    //generate picking allocation(delivery#) 
    closed.route('/generate/pickingallocation/:pickerBoyOrderMappingId').patch(  //change to patch
      // [joiInvValidate],
      getPickedItemDetail,
      generateDelivery,
      updateSapDeliveryDetail,
    
      ctrl.pickingAllocation
      // ctrl.getPickedItemByPickerOrderId
      
    );

      // get Pending invoice
      closed.route('/sales-order/getpicking/').get(
        // [joiEditAddedItem], // joi edit item
        // checkWhetherItsAValidItemUpdate, // check whether the valid item update
        verifyAppToken, // verify app token 
        ctrl.getPickingList // get controller 
      );


    // edit the item quantity 
    closed.route('/sales-order/edit-item/:pickerBoySalesOrderMappingId').patch(
      [joiEditAddedItem], // joi edit item
      checkWhetherItsAValidItemUpdate, // check whether the valid item update
      verifyAppToken, // verify app token 
      ctrl.patchItems // get controller 
    );

    // list the Basket item  
    
    closed.route('/:type/picking/:pickerBoySalesOrderMappingId').get(
    //  [joiPickingValidate]
   
      verifyAppToken, // verify app token 
      ctrl.getBucketDetail // get controller 
    );
    

  };
}

module.exports = userRoutes();
