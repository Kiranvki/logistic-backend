// Controller
const deliveryExecutiveCtrl = require('../../components/employee/delivery_executive/delivery_executive.controller');

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
    let deliveryId = req.body.deliveryId || req.params.deliveryId; // get the delivery executive id 

    // mongoose valid id 
    if (objectId.isValid(deliveryId)) {

      // check whether the email id is unique or not 
      let isValidDeliveryExecutive = await deliveryExecutiveCtrl.getDetails(deliveryId)

      // if email is unique
      if (isValidDeliveryExecutive.success) {
        info('Valid pickerBoy')
        // injecting the data into the request body
        req.body.isValidDeliveryExecutive = isValidDeliveryExecutive.data;
        // move on
        next();
      } else {
        error('INVALID deliveryExecutive !');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.deliveryExecutiveIdInvalidEitherDeletedOrDeactivated);
      }
    } else {
      error('The deliveryExecutive ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidDeliveryExecutive);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
