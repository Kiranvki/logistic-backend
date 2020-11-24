// Controller
const pickerBoyCtrl = require('../../components/picker_app/employee/picker_boy/picker_boy.controller');
const pickerBoySessionCtrl = require('../../components/picker_app/onBoard/app_picker_user_session/app_picker_user_session.controller');

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
    info('Check whether the picker boy id is valid or not !');
    let objectId = mongoose.Types.ObjectId; // object id
    let pickerBoyId = req.body.pickerBoyId || req.params.pickerBoyId || req.user._id; // get the picker boy id

    // mongoose valid id 
    if (objectId.isValid(pickerBoyId)) {

      // check whether the email id is unique or not 
      let isValidPickerBoy = await pickerBoyCtrl.getDetails(pickerBoyId)

      // if email is unique
      if (isValidPickerBoy.success) {
        info('Valid Picker Boy')

        // check whether user session data is created 
        let userSession = await pickerBoySessionCtrl.getUserSession(pickerBoyId);

        // user session check 
        if (userSession.success) {

          // injecting into request body
          req.body.userSession = userSession.data;
          req.body.isValidPickerBoy = isValidPickerBoy.data;

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
