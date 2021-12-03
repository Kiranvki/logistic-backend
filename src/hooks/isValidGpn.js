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
    info('Check whether the GPN is valid or not !');
    // let objectId = mongoose.Types.ObjectId; // object id
    let gpn = req.body.gpn || req.params.gpn || req.query.gpn // get the gpn number

    // check if the format is string or not
    if(typeof(gpn)=="string") {

      // check whether the gpn exists or not 
      let isValidGpn = await securityGuardCtrl.getGpnNumber(gpn)

      // if Gpn exist
      if (isValidGpn.success) {
        info('Valid GPN')

          // move on
          return next();

       
      } else {
        error('INVALID GPN!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.securityGuardApp.gpnIsInvalid);
      }
    } else {
      error('The GPN data type is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.securityGuardApp.gpnDataTypeIsInvalid);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
