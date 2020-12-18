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
    let pickerBoyId = req.params.pickerBoyId || req.user._id, // picker id 
      fullName = req.body.fullName,
      dateOfBirth = req.body.dateOfBirth,
      isNotChanged = [],
      toChangeObject = []; // change object 
    if (dateOfBirth && !_.isEmpty(dateOfBirth)) {
      dateOfBirth = moment(dateOfBirth, 'DD-MM-YYYY').set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();
    }
    console.log('dateOfBirth', dateOfBirth);

    if (objectId.isValid(pickerBoyId)) {
      // check whether the document type already exist or not 
      let getPickerBoyDetails = await PickerBoyCtrl.getDetails(pickerBoyId);

      // if asm details fetched successfully
      if (getPickerBoyDetails.success) {
        info('VALID PickerBoy!');

        let DateOfBirthFromDb = '';
        if (dateOfBirth && !_.isEmpty(dateOfBirth)) {
          DateOfBirthFromDb = moment(getPickerBoyDetails.data.dateOfBirth, 'DD-MM-YYYY').set({
            h: 0,
            m: 0,
            s: 0,
            millisecond: 0
          }).toDate();
        }

        console.log('DateOfBirthFromDb', DateOfBirthFromDb);

        // check whether the field values are changed or not 
        if (fullName && fullName == getPickerBoyDetails.data.fullName) isNotChanged.push('fullName');
        else if (fullName) toChangeObject = { ...toChangeObject, 'fullName': fullName }
        if (dateOfBirth && dateOfBirth == DateOfBirthFromDb) isNotChanged.push('dateOfBirth')
        else if (dateOfBirth) toChangeObject = { ...toChangeObject, 'dateOfBirth': DateOfBirthFromDb }


        // including it to request body 
        req.body.toChangeObject = toChangeObject;
        req.body.isNotChanged = isNotChanged;
        req.body.asmMappingChangeObject = asmMappingChangeObject;


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
