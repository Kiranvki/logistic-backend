// Controller
const PickerBoyCtrl = require('../../components/employee/picker_boy/picker_boy.controller');

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
    info('check whether the picker profile update is valid !');

    // creating a valid mongoose type object 
    let objectId = mongoose.Types.ObjectId;

    // get the picker id   
    let contactMobile = req.body.contactMobile, // contact number 
        email = req.body.email, // email  
        pickerBoyId = req.params.pickerBoyId || req.user._id, // picker id 
        fullName = req.body.fullName,
        dateOfBirth = req.body.dateOfBirth || '',
        isNotChanged = [],
        toChangeObject = [],// change object 
        DateOfBirthFromDb = moment();


    if (objectId.isValid(pickerBoyId)) {
      // check whether the document type already exist or not 
      let getPickerBoyDetails = await PickerBoyCtrl.getDetails(pickerBoyId);

      // if picker details fetched successfully
      if (getPickerBoyDetails.success) {
        info('VALID PickerBoy!');

        // if (dateOfBirth && !_.isEmpty(dateOfBirth)) {
        //   dateOfBirth = moment(dateOfBirth, 'DD-MM-YYYY').toDate();
        //   DateOfBirthFromDb = moment(getPickerBoyDetails.data.dateOfBirth, 'DD-MM-YYYY').toDate();
        //   //checking both dates are same
        //   if (moment(DateOfBirthFromDb).isSame(dateOfBirth)) {
        //     isNotChanged.push('dateOfBirth')
        //   } else {
        //     toChangeObject = { ...toChangeObject, 'dateOfBirth': dateOfBirth }
        //   }
        // }

        // if (fullName && fullName == getPickerBoyDetails.data.fullName) isNotChanged.push('fullName');
        // else if (fullName) toChangeObject = { ...toChangeObject, 'fullName': fullName }

        if (email && email == getSalesmanDetails.data.email) isNotChanged.push('email');
        else if (email) toChangeObject = { ...toChangeObject, 'email': email }
        if (contactMobile && contactMobile == getSalesmanDetails.data.contactMobile) isNotChanged.push('contactMobile')
        else if (contactMobile) toChangeObject = { ...toChangeObject, 'contactMobile': parseInt(contactMobile) }

        // including it to request body 
        req.body.toChangeObject = toChangeObject;
        req.body.isNotChanged = isNotChanged;

        // if there is nothing to change
        if (isNotChanged.length)
          return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.dataIsNotChanged, req.body.isNotChanged);
        else next(); // move on

        // invalid asm 
      } else {
        error('INVALID PickerBoy!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.asmIdInvalidEitherDeletedOrDeactivated);
      }

      // asm id is invalid 
    } else {
      error('The PickerBoy ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidAsmId);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
