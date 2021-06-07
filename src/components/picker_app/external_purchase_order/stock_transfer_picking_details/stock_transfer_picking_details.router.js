// user controller
const ctrl = require("./stock_transfer_picking_details.controller");
const poCtrl = require("../purchase_order/purchase_order.controller");



// custom joi validation
const {
  joiStartpicking,
  joiResumePicking,
  joiPickingItem,
  joiGenerateDelivery,
  joiGenerateInvoice,
  joiHistoryDetail,
  joiPendingOrderDetail,
} = require("./stock_transfer_picking_details.validators");

// hooks
const {
  isValidPoId,
  poReceivingInitiationValidations,
  hasOrderAlreadyInReceivingState,
  isValidInputsForReceivedItem,
  getStoDetail,
  checkIsInPickingState,
  checkIsValidPicking,
  isSTOAlreadyInPickingState,
  getPickedStoDetail,
  getPickedSTOItemDetail,
  generatePickingAllocationForSto,
  generateInvoice,
  getDeliveryNumber,
  fetchInvoice,
  isPickingAlreadyGenerated,
  isInvoiceAlreadyGenerated,
  updateStoInvoiceToDB,
  isSTOItemAlreadyAdded,
  isValidItemQuantity,
  updateOutboundDeliveryToDb
} = require("../../../../hooks/app");
// auth
const { verifyUserToken } = require("../../../../hooks/Auth");
const { verifyAppToken } = require("../../../../hooks/app/Auth");

// exporting the user routes
function stockTransferPickingDetailRouter() {
  //open, closed
  return (open, closed) => {
    //Create an entry STO picking detail Collection / CReate Cart or Bucket
    closed.route('/stocktransfer/startpicking/:STOID').patch(
      verifyAppToken,
      joiStartpicking,
      checkIsValidPicking,
      // isSTOAlreadyInPickingState,
      getStoDetail,
      ctrl.startPicking
    );
    // add item into Selected STO PICKING Detail Collection / Add Item to Bucket or Cart
    closed.route('/stocktransfer/additem/:stoPickingId').post(
      verifyAppToken,
      isSTOItemAlreadyAdded, // check whether the item is already added
      isValidItemQuantity,
      getPickedStoDetail,
      ctrl.addItem
    );
    //resume picking api
    closed.route('/stocktransfer/picking/:stoPickingId').get(
      verifyAppToken,
      joiResumePicking,

      ctrl.getPickedItemStatus
    );




    // Get Bucket Detail 
    closed.route('/stocktransfer/bucketdetail/:stoPickingId').get(
      verifyAppToken,
      ctrl.getBucketDetail
    );


    // Generate picking_allocation
    closed.route('/stocktransfer/generateDelivery/:stoPickingId').get(
      verifyAppToken,
      // joiGenerateDelivery,
      isPickingAlreadyGenerated,
      getPickedSTOItemDetail,
      getStoDetail,
      generatePickingAllocationForSto,
      updateOutboundDeliveryToDb,
      ctrl.generateStoDelivery
    );


    // generate Invoice
    closed.route('/stocktransfer/generateInvoice/:stoPickingId').get(
      verifyAppToken,
      // joiGenerateInvoice,
      isInvoiceAlreadyGenerated,
      getDeliveryNumber,
      generateInvoice,
      fetchInvoice,
      updateStoInvoiceToDB,
      ctrl.generateStoInvoice

    );


    // get History
    closed.route('/stocktransfer/history').get(
      verifyAppToken,

      ctrl.getHistory

    );

    // get History detail
    closed.route('/stocktransfer/history/detail/:stoPickingId').get(
      verifyAppToken,
      joiHistoryDetail,

      ctrl.getOrderHistoryAndInvoices

    );

    // get ongoing Order
    closed.route('/stocktransfer/ongoing').get(
      verifyAppToken,

      ctrl.getOnGoing

    );

    // get ongoing Order
    closed.route('/stocktransfer/pending/invoice').get(
      verifyAppToken,

      ctrl.getPendingInvoices

    );

    // get pending Order
    closed.route('/stocktransfer/pending/detail/:orderid').get(
      verifyAppToken,
      // joiPendingOrderDetail,

      ctrl.getPendingOrderAndInvoices

    );






  }
}

module.exports = stockTransferPickingDetailRouter();