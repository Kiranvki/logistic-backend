const ctrl = require('./app_delivery_trip.controller');
const multer = require('multer');
const multipartMiddleware = multer();

const { updateDeliveryStatusVal,
  getHistoryVal,
  getInTripVal,
  updateOdometerReadingVal,
  getInvoiceVal,
  updateOrderStatusVal,
  getOrderDetailVal,
  getTripByIdVal,
  generateGpnVal,
  joiTripId,
  joiSoId,

} = require('./app_delivery_trip.validators')

const {
  isDeliveryExecutiveCheckedIn, // is user checked in
  isValidDeliveryId, // check whether the salesman id is valid or not
  isDeliveryAlreadyCheckedIn, // check whether the user already check In
  getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out
  deliveryGenerateMonthDaysAndOtherMetaData, // generate month days and other meta data
  isActiveDelivery,
  isValidMultiImageIsUploading,
  isValidCustomerNotAvailUpload,
  isvalidSignatureIsUploading

} = require("../../../hooks/app");

// auth
const { verifyDeliveryAppToken } = require("../../../hooks/app/Auth");
const { getAllCheckInVehicleDetails } = require('../../../hooks');
const joiValidation = require('../../../responses/types/joiValidation');



function tripsRoutes() {
  //open, closed
  return (open, closed) => {

    closed.route('/get-trip').get(
      verifyDeliveryAppToken,
      isValidDeliveryId,
      isActiveDelivery,
      // verifyAppToken, // verify app token
      ctrl.getTripByDeliveryExecutiveId
    );

    closed.route('/get-trip/:type/detail/:tripid').get(
      getTripByIdVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.getTripByTripId
    );

    // post 
    // type orderid
    closed.route('/orderdetail/:type/:orderid').get(
      getOrderDetailVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.getOrderDetails
    );
    // get sales order by customer mobile
    closed.route('/trip/order/:type/:orderId/:phoneNumber').get(
      getHistoryVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,


      ctrl.getOrderByCustomer
    );

    // closed.route('/orderdetail/:type/:orderid').post(
    //   // verifyAppToken, // verify app token
    //   ctrl.getOrderDetails 
    // );

    closed.route('/orderdetail/update/:type/:itemId').post(
      updateOrderStatusVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.updateOrderStatus
    );

    closed.route('/trip/generategpn/:type').post(
      generateGpnVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.generateGpnNumber
    );

    closed.route('/trip/viewinvoice').get(
      getInvoiceVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.getInvoiceByNumber
    );

    closed.route('/trip/starttrip/:tripid').patch(
      updateOdometerReadingVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.updateOdometerReading
    );

    closed.route('/trip/intrip/:type').get(
      getInTripVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,

     // verifyAppToken, // verify app token
     ctrl.getInTrip
    );

    closed.route('/trip/intrip/:type/invoiceList').get(
      getInTripVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,

      // verifyAppToken, // verify app token
      ctrl.getInTripInvoicelist
    );

    closed.route('/trip/intrip/:type/invoiceList/viewInvoice').get(
      getInvoiceVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.getInvoiceVew
    );


    closed.route('/get-trip/history').get(
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.getTripHistoryByDeliveryExecutiveId
    );


    closed.route('/trip/history/:type').get(
      getHistoryVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,


      ctrl.getHistoryByOrderType
    );

    // salesorderID
    closed.route('/trip/deliverystatus/:type/:id').post(
      updateDeliveryStatusVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,
      ctrl.updateItemStatusAndCaretOut
    );

    closed.route('/get-trip/pending').get(
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.getPendingTrip
    );

    //get sale order by trip id

    closed.route('/:tripId/salesorders').get(
      [joiTripId],
      verifyDeliveryAppToken,
      ctrl.getSalesOrdersbyTripID
    )

    closed.route('/trip/intrip/caputreDocument/:salesOrdersId').post(
      // getInvoiceVal,
      verifyDeliveryAppToken,
      multipartMiddleware.array('files',5), // multer middleware
      isValidMultiImageIsUploading,
      ctrl.uploadDocuments
      // ctrl.justChecking
    )

    //get ivoice numbers by sales oders

    closed.route('/:salesorderId/invoiceList').get(
      [joiSoId],
      verifyDeliveryAppToken,
      ctrl.getInvoiceNumberbySo
    )

    closed.route('/trip/history/:salesorderId/invoiceList').get(
      [joiSoId],
      verifyDeliveryAppToken,
      ctrl.getHistoryInvoiceListbySo
    )
    closed.route('/get-dispute').get(
      verifyDeliveryAppToken,
      isValidDeliveryId,
      isActiveDelivery,
      // verifyAppToken, // verify app token
      ctrl.getdispute
    );

    closed.route('/get-dispute/:disputeId/viewDisputeDetails').get(
      verifyDeliveryAppToken,
      isValidDeliveryId,
      isActiveDelivery,
      // verifyAppToken, // verify app token
      ctrl.viewDisputeDetails
    );

    closed.route('/get-trip/pending/:salesorderId/invoiceList').get(
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.getPendingInvoiceListSo
    )

    closed.route('/get-trip/pending/viewInvoice').get(
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.getPendingViewInvoice
    )

    closed.route('/trip/intrip/:salesOrdersId/signature').post(
      //getInvoiceVal,
      verifyDeliveryAppToken,
      multipartMiddleware.single('file'), // multer middleware
      isvalidSignatureIsUploading,
      ctrl.customerSignature
    )

    closed.route('/trip/intrip/:salesOrdersId/customerNotAvailable').post(
      //getInvoiceVal,
      verifyDeliveryAppToken,
      multipartMiddleware.array('files',5), // multer middleware
      isValidCustomerNotAvailUpload, // is valid balance confirmation file upload 
      ctrl.uploadImageCustomerNotAvailable // controller function
    )

    closed.route('/trip/intrip/salesorders/viewInvoiceSummary').get(
      getInvoiceVal,
      verifyDeliveryAppToken,
      isValidDeliveryId,
      // verifyAppToken, // verify app token
      ctrl.getInvoiceSummary
    );

    closed.route('/get-dispute/:disputeId/:condition/updateDisputeDetails').patch(
      verifyDeliveryAppToken,
      ctrl.disputeAcceptOrReject
    );









  };



};



module.exports = tripsRoutes();
