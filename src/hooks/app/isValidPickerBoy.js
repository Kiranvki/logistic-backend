// Controller
const PickerBoyCtrl = require('../../components/employee/picker_boy/picker_boy.controller');

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
    info('Check whether the user email id is unique or not!');
    let objectId = mongoose.Types.ObjectId; // object id
    let pickerBoyId = req.body.pickerBoyId || req.params.pickerBoyId; // get the picker boy id 

    // mongoose valid id 
    if (objectId.isValid(pickerBoyId)) {

      // check whether the email id is unique or not 
      let isValidPickerBoy = await PickerBoyCtrl.getDetails(pickerBoyId)

      // if email is unique
      if (isValidPickerBoy.success) {
        info('Valid pickerBoy')
        // injecting the data into the request body
        req.body.isValidPickerBoy = isValidPickerBoy.data;
        // move on
        next();
      } else {
        error('INVALID pickerBoy!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.pickerBoyIdInvalidEitherDeletedOrDeactivated);
      }
    } else {
      error('The pickerBoy ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidPickerBoy);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
