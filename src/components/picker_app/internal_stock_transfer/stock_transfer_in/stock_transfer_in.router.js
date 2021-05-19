// user controller
const ctrl = require("./stock_transfer_in.controller");

// custom joi validation
const {
  joiStiIdValidation,
  stiList,
  joiStockTransferInFilter,
} = require("./stock_transfer_in.validators");

// hooks
const {
  isInvoiceGenerated, // check whether the invoice is already generated
} = require("../../../../hooks/app");

// auth
const { verifyUserToken } = require("../../../../hooks/Auth");

// auth
const { verifyAppToken } = require("../../../../hooks/app/Auth");

// exporting the user routes
function stockTransferInRoutes() {
  //open, closed
  return (open, closed) => {
    // generating invoice
    closed.route("").get(
      [stiList], // joi validation

      verifyAppToken, // verify app user token
      ctrl.getSTIList // stist controller
    );

    // getting  invoice details
    closed.route("/:stiId").get(
      [joiStiIdValidation], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token
      ctrl.getSTIDetails // stist controller
    );
    // // getting  invoice details
    // closed.route('/startPickup/:stiId').get(
    //   [joiStiIdValidation], // joi validation
    //   // isInvoiceGenerated, // check whether the invoice is already generated
    //   // verifyAppToken, // verify app user token
    //   ctrl.startPickUP // stist controller
    // );

    closed.route("/filteredList/:type").get(
      [joiStockTransferInFilter], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token
      ctrl.stiFilteredList // stist controller
    );
    closed.route("/filteredSTI/:stiId").get(
      [joiStiIdValidation], // joi validation
      // isInvoiceGenerated, // check whether the invoice is already generated
      verifyAppToken, // verify app user token
      ctrl.filteredSTIDetails // stist controller
    );
  };
}

module.exports = stockTransferInRoutes();
