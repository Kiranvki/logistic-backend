// Controller
const securityGuardCtrl = require('../components/employee/security_guard/security_guard.controller');
const securityGuardSessionCtrl = require('../components/security_guard_app/onBoard/app_security_guard_user_session/app_security_guard_user_session.controller');

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the Invoice exists or not !');
    // let objectId = mongoose.Types.ObjectId; // object id
    let invoiceNo = req.body.invoiceNo || req.params.invoiceNo || req.query.invoiceNo // get the invoiceNo

    // check if the format is string or not
    if(typeof(invoiceNo)=="string") {

      // check whether the gpn exists or not 
      let isValidInvoice = await securityGuardCtrl.getInvoiceAlreadyVerifiedDetails(invoiceNo)

      // if invoice exists
      if (isValidInvoice.success) {
        info('Invoice Not Verified')

          // move on
          return next();

       
      } else {
        error('Cannot find invoice or invoice is already verified!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.securityGuardApp.invoiceAlreadyVerified);
      }
    } else {
      error('The invoiceNo data type is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.securityGuardApp.invoiceNoDataTypeIsInvalid);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
