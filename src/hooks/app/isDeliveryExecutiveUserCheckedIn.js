// Controller
const AttendanceCtrl = require('../../components/delivery_app/onBoard/app_delivery_user_attendance/app_delivery_user_attendance.controller'); // attendance controller 

// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const mongoose = require('mongoose');
const moment = require('moment');
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the delivery executive id is valid or not !');
    let objectId = mongoose.Types.ObjectId; // object id
    let deliveryId = req.user._id; // get the picker id 
    // getting todays date 
    let date = new Date();
    let endOfTheDay = moment(date).set({
      h: 24,
      m: 59,
      s: 0,
      millisecond: 0
    }).toDate();
    let startOfTheDay = moment(date).set({
      h: 0,
      m: 0,
      s: 0,
      millisecond: 0
    }).toDate();

    // mongoose valid id 
    if (objectId.isValid(deliveryId)) {

      // check whether the email id is unique or not 
      let deliveryExecutiveAttendanceDetails = await AttendanceCtrl.getDetails(pickerBoyId, startOfTheDay, endOfTheDay)

      // if email is unique
      if (deliveryExecutiveAttendanceDetails.success) {
        info('Valid delivery executive')

        // check if the user is already checked out
        if (deliveryExecutiveAttendanceDetails.data.attendanceLog && deliveryExecutiveAttendanceDetails.data.attendanceLog.length) {

          // abstraction of data 
          let attendanceId = deliveryExecutiveAttendanceDetails.data._id;
          let attendanceLogId = deliveryExecutiveAttendanceDetails.data.attendanceLog[deliveryExecutiveAttendanceDetails.data.attendanceLog.length - 1]._id;
          let checkInTimeInMins = deliveryExecutiveAttendanceDetails.data.attendanceLog[deliveryExecutiveAttendanceDetails.data.attendanceLog.length - 1].checkInTimeInMins;

          // injecting into request body 
          req.body.attendanceId = attendanceId;
          req.body.attendanceLogId = attendanceLogId;
          req.body.checkInTimeInMins = checkInTimeInMins;

          // move on 
          return next();

        } else {
          error('User Already Checked Out !');
          return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.userAlreadyCheckedOut);
        }

        // if user session not exist 
      } else {
        error('INVALID deliveryExecutive!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.deliveryExecutiveNotCheckedIn);
      }

      // if delivery executive id is invalid
    } else {
      error('The deliveryExecutive ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.invalidDeliveryExecutiveId);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
