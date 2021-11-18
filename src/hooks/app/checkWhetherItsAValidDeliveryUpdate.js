// Controller
const DeliveryCtrl = require('../../components/employee/delivery_executive/delivery_executive.controller');

// Responses & others utils 
const mongoose = require('mongoose');
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const _ = require('lodash');
const {
  error,
  info
} = require('../../utils').logging;
const moment = require('moment');

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('check whether the delivery executive update is valid !');

    // creating a valid mongoose type object 
    let objectId = mongoose.Types.ObjectId;
    // get the picker id   
    let deliveryId = req.user._id, // picker id 
    fullName = req.body.fullName,
    dateOfBirth = req.body.dateOfBirth || '',
    isNotChanged = [],
    toChangeObject = [],// change object 
    DateOfBirthFromDb = moment();
    
    
    console.log(deliveryId,"delivery ID===>")
    if (objectId.isValid(deliveryId)) {
      // check whether the document type already exist or not 
      let getDeliveryDetails = await DeliveryCtrl.getDetails(deliveryId);

      console.log("getDeliveryDetails==>",getDeliveryDetails)

      // if picker details fetched successfully
      if (getDeliveryDetails.success) {
        info('VALID Delivery Executive!');

        if (dateOfBirth && !_.isEmpty(dateOfBirth)) {
          dateOfBirth = moment(dateOfBirth, 'DD-MM-YYYY').toDate();
          DateOfBirthFromDb = moment(getDeliveryDetails.data.dateOfBirth, 'DD-MM-YYYY').toDate();
          //checking both dates are same
          if (moment(DateOfBirthFromDb).isSame(dateOfBirth)) {
            isNotChanged.push('dateOfBirth')
          } else {
            toChangeObject = { ...toChangeObject, 'dateOfBirth': dateOfBirth }
          }
        }

        if (fullName && fullName == getDeliveryDetails.data.fullName) isNotChanged.push('fullName');
        else if (fullName) toChangeObject = { ...toChangeObject, 'fullName': fullName }


        // including it to request body 
        req.body.toChangeObject = toChangeObject;
        req.body.isNotChanged = isNotChanged;

        // if there is nothing to change
        if (isNotChanged.length)
          return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.dataIsNotChanged, req.body.isNotChanged);
        else next(); // move on

        // invalid asm 
      } else {
        error('INVALID Delivery Executive!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.deliveryIdInvalidEitherDeletedOrDeactivated);
      }

      // asm id is invalid 
    } else {
      error('The Delivery Executve ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidAsmId);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
