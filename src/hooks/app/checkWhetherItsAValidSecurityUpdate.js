// Controller
const SecurityCtrl = require('../../components/employee/security_guard/security_guard.controller');

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
    info('check whether the Security profile update is valid !');

    // creating a valid mongoose type object 
    let objectId = mongoose.Types.ObjectId;

    // get the Security Guard Id   
    let securityGuardId = req.params.securityGuardId || req.user._id, // security id 
      fullName = req.body.fullName,
      dateOfBirth = req.body.dateOfBirth || '',
      isNotChanged = [],
      toChangeObject = [],// change object 
      DateOfBirthFromDb = moment();


    if (objectId.isValid(securityGuardId)) {
      // check whether the document type already exist or not 
      let getSecurityGuardDetails = await SecurityCtrl.getDetails(securityGuardId);

      // if picker details fetched successfully
      if (getSecurityGuardDetails.success) {
        info('VALID PickerBoy!');

        if (dateOfBirth && !_.isEmpty(dateOfBirth)) {
          dateOfBirth = moment(dateOfBirth, 'DD-MM-YYYY').toDate();
          DateOfBirthFromDb = moment(getSecurityGuardDetails.data.dateOfBirth, 'DD-MM-YYYY').toDate();
          //checking both dates are same
          if (moment(DateOfBirthFromDb).isSame(dateOfBirth)) {
            isNotChanged.push('dateOfBirth')
          } else {
            toChangeObject = { ...toChangeObject, 'dateOfBirth': dateOfBirth }
          }
        }

        if (fullName && fullName == getSecurityGuardDetails.data.fullName) isNotChanged.push('fullName');
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
        error('INVALID Security !');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.securityIdInvalidEitherDeletedOrDeactivated);
      }

      // asm id is invalid 
    } else {
      error('The Security ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidSecurityId);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
