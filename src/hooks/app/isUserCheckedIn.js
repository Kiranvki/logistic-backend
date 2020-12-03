// Controller
const AttendanceCtrl = require('../../components/picker_app/onBoard/app_picker_user_attendance/app_picker_user_attendance.controller'); // attendance controller 
const UserSessionCtrl = require('../../components/picker_app/onBoard/app_picker_user_session');

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
    info('Check whether the salesman id is valid or not !');
    let objectId = mongoose.Types.ObjectId; // object id
    let salesmanId = req.user._id; // get the salesman id 
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
    if (objectId.isValid(salesmanId)) {

      // check whether the email id is unique or not 
      let salesmanAttendanceDetails = await AttendanceCtrl.getDetails(salesmanId, startOfTheDay, endOfTheDay)

      // if email is unique
      if (salesmanAttendanceDetails.success) {
        info('Valid salesman')

        // check if the user is already checked out
        if (salesmanAttendanceDetails.data.attendanceLog && salesmanAttendanceDetails.data.attendanceLog.length) {

          // abstraction of data 
          let attendanceId = salesmanAttendanceDetails.data._id;
          let attendanceLogId = salesmanAttendanceDetails.data.attendanceLog[salesmanAttendanceDetails.data.attendanceLog.length - 1]._id;
          let checkInTimeInMins = salesmanAttendanceDetails.data.attendanceLog[salesmanAttendanceDetails.data.attendanceLog.length - 1].checkInTimeInMins;

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
        error('INVALID salesman!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.salesmanNotCheckedIn);
      }

      // if salesman id is invalid 
    } else {
      error('The salesman ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserAttendance.invalidSalesmanId);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
