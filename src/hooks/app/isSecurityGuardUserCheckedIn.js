// Controller
const AttendanceCtrl = require('../../components/security_guard_app/onBoard/app_security_guard_attendance/app_security_guard_attendance.controller'); // attendance controller 
const UserSessionCtrl = require('../../components/security_guard_app/onBoard/app_security_guard_user_session/app_security_guard_user_session.controller');

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
    info('Check whether the security gurad id is valid or not !');
    let objectId = mongoose.Types.ObjectId; // object id
    let securityGuardId = req.user._id; // get the security guard id 
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
    if (objectId.isValid(securityGuardId)) {

      // check whether the email id is unique or not 
      let securityGuardAttendanceDetails = await AttendanceCtrl.getDetails(securityGuardId, startOfTheDay, endOfTheDay)

      // if email is unique
      if (securityGuardAttendanceDetails.success) {
        info('Valid Security Guard')

        // check if the user is already checked out
        if (securityGuardAttendanceDetails.data.attendanceLog && securityGuardAttendanceDetails.data.attendanceLog.length) {

          // abstraction of data 
          let attendanceId = securityGuardAttendanceDetails.data._id;
          let attendanceLogId = securityGuardAttendanceDetails.data.attendanceLog[securityGuardAttendanceDetails.data.attendanceLog.length - 1]._id;
          let checkInTimeInMins = securityGuardAttendanceDetails.data.attendanceLog[securityGuardAttendanceDetails.data.attendanceLog.length - 1].checkInTimeInMins;

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
        error('INVALID Security Guard!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.pickerBoyNotCheckedIn);
      }

      // if picker id is invalid
    } else {
      error('The Security Guard ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.invalidPickerBoyId);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
