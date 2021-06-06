// user controller
const ctrl = require("./purchase_order.controller");

// custom joi validation
const {
  joiPoIdValidation,
  poList,
  joiVendorNoValidation,
  joiPurchaseOrderFilter,
} = require("./purchase_order.validators");

// hooks
const {
  checkIsInPickingState,
  isInvoiceGenerated, // check whether the invoice is already generated
} = require("../../../../hooks/app");

// auth
const { verifyUserToken } = require("../../../../hooks/Auth");

// auth
const { verifyAppToken } = require("../../../../hooks/app/Auth");

// exporting the user routes
function purchaseOrderRoutes() {
  //open, closed
  return (open, closed) => {
    // generating invoice
    closed.route("").get(
      [poList], // joi validation

      verifyAppToken, // verify app user token
      ctrl.getPOList // post controller
    );

    // getting  invoice details
    closed.route("/:poId").get(
      [joiPoIdValidation], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token
      ctrl.getPODetails // post controller
    );
    // // getting  invoice details
    // closed.route('/startPickup/:poId').get(
    //   [joiPoIdValidation], // joi validation
    //   // isInvoiceGenerated, // check whether the invoice is already generated
    //   // verifyAppToken, // verify app user token
    //   ctrl.startPickUP // post controller
    // );
    closed.route("/vendorDetails/:vendor_number").get(
      [joiVendorNoValidation], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token
      ctrl.getVendorDetails // post controller
    );
    closed.route("/filteredList/:type").get(
      [joiPurchaseOrderFilter], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token
      ctrl.poFilteredList // post controller
    );
    closed.route("/filteredPO/:poId").get(
      [joiPoIdValidation], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token
      ctrl.filteredPODetails // post controller
    );
    
    closed.route("/picking/getstocktransfer").get(
    
      verifyAppToken,
      checkIsInPickingState,
      ctrl.getStockTransferList // get controller
    );


    closed.route("/picking/getpendingstocktransfer").get(
    
      verifyAppToken,
      ctrl.getPendingStockTransferList // get controller
    );


    
  };
}

module.exports = purchaseOrderRoutes();
