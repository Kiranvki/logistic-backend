// Controller
const deliveryCtrl = require('../../components/employee/delivery_executive/delivery_executive.controller');
const deliveryExecutiveSessionCtrl = require('../../components/delivery_app/onBoard/app_delivery_user_session/app_delivery_user_session.controller');

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
    info('Check whether the Delivery Executive id is valid or not !');
    let objectId = mongoose.Types.ObjectId; // object id
    let deliveryId = req.body.deliveryId || req.params.deliveryId || req.user._id; // get the delivery executive id

    // mongoose valid id 
    if (objectId.isValid(deliveryId)) {

      // check whether the email id is unique or not 
      let isValidDeliveryExecutive= await deliveryCtrl.getDetails(deliveryId)

      // if email is unique
      if (isValidDeliveryExecutive.success) {
        info('Valid Picker Boy')

        // check whether user session data is created 
        let userSession = await deliveryExecutiveSessionCtrl.getUserSession(deliveryId);

        // user session check 
        if (userSession.success) {

          // injecting into request body
          req.body.userSession = userSession.data;
          req.body.isValidDeliveryExecutive = isValidDeliveryExecutive.data;

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
