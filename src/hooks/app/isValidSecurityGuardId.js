// Controller
const securityGuardCtrl = require('../../components/employee/security_guard/security_guard.controller');
const securityGuardSessionCtrl = require('../../components/security_guard_app/onBoard/app_security_guard_user_session/app_security_guard_user_session.controller');

// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the security guard id is valid or not !');
    let objectId = mongoose.Types.ObjectId; // object id
    let securityGuardId = req.body.securityGuardId || req.params.securityGuardId || req.user._id; // get the picker boy id

    // mongoose valid id 
    if (objectId.isValid(securityGuardId)) {

      // check whether the email id is unique or not 
      let isValidSecurityGuard = await securityGuardCtrl.getDetails(securityGuardId)

      // if email is unique
      if (isValidSecurityGuard.success) {
        info('Valid Security Guard')

        // check whether user session data is created 
        let userSession = await securityGuardSessionCtrl.getUserSession(securityGuardId);

        // user session check 
        if (userSession.success) {

          // injecting into request body
          req.body.userSession = userSession.data;
          req.body.isValidSecurityGuard = isValidSecurityGuard.data;

          // move on
          return next();

          // if user session not exist 
        } else {
          error('User Still not requested for login ');
          return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserOnBoard.userLoginRequestStillNotRegenerated);
        }
      } else {
        error('INVALID salesman!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.salesmanIdInvalidEitherDeletedOrDeactivated);
      }
    } else {
      error('The salesman ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidSalesmanId);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
