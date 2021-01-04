// Controller
const AttendanceCtrl = require('../../components/security_guard_app/onBoard/app_security_guard_attendance/app_security_guard_attendance.controller'); // attendance controller 
const BasicCtrl = require('../../components/basic_config/basic_config.controller'); // basic controller 

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
    info('Check whether the security guard id is valid or not !');
    const freezeTimeForToday = await BasicCtrl.GET_LAST_PERMITTED_CHECK_IN_TIME().then((res) => { if (res.success) return res.data; else return "10:20"; });
    let freezeTime = freezeTimeForToday.split(':');

    let objectId = mongoose.Types.ObjectId; // object id
    let securityGuardId = req.user._id; // get the security guard id 
    // getting todays date 
    let date = new Date();
    let currentHour = date.getHours();
    let currentMin = date.getMinutes();

    // check whether the check in is passed after the freeze time 
    if (currentHour > freezeTime[0] && currentMin > freezeTime[1]) {
      error('Checked In Time has passed !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.checkInNotAllowedAfterFreezeTime(freezeTimeForToday));
    }

    // end of the day
    let endOfTheDay = moment(date).set({
      h: 24,
      m: 59,
      s: 0,
      millisecond: 0
    }).toDate();

    // start of the day 
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
          error('User Already Checked Out !');
          let lastCheckedInMins = securityGuardAttendanceDetails.data.attendanceLog[securityGuardAttendanceDetails.data.attendanceLog.length - 1].checkInTimeInMins;
          let lastCheckedIn = moment.utc(moment.duration(lastCheckedInMins, "minutes").asMilliseconds()).format("HH:mm")
          return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.userAlreadyCheckedInAt(lastCheckedIn));
        } else {
          return next();
        }

        // if user session not exist 
      } else return next();

      // if security guard id is invalid
    } else {
      error('The Security Guard ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.invalidSalesmanId);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
