// Controller
const vehicleAttendanceCtrl = require('../components/vehicle/vehicle_attendance/vehicle_attendance.controller'); // attendance controller 

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const mongoose = require('mongoose');
const moment = require('moment');
const {
  error,
  info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the vehicle id is valid or not !');
    let objectId = mongoose.Types.ObjectId; // object id
    let vehicleId = req.params.vehicleId; // get the vehicle id 
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
    if (objectId.isValid(vehicleId)) {

      // check whether the email id is unique or not 
      let vehicleAttendanceDetails = await vehicleAttendanceCtrl.getDetails(vehicleId, startOfTheDay, endOfTheDay)

      // if email is unique
      if (vehicleAttendanceDetails.success) {
        info('Valid vehicle')

        // check if the user is already checked out
        if (vehicleAttendanceDetails.data.attendanceLog && vehicleAttendanceDetails.data.attendanceLog.length) {

          // abstraction of data 
          let attendanceId = vehicleAttendanceDetails.data._id;
          let attendanceLogId = vehicleAttendanceDetails.data.attendanceLog[vehicleAttendanceDetails.data.attendanceLog.length - 1]._id;
          let checkInTimeInMins = vehicleAttendanceDetails.data.attendanceLog[vehicleAttendanceDetails.data.attendanceLog.length - 1].checkInTimeInMins;

          // injecting into request body 
          req.body.attendanceId = attendanceId;
          req.body.attendanceLogId = attendanceLogId;
          req.body.checkInTimeInMins = checkInTimeInMins;

          // move on 
          return next();

        } else {
          error('Vehicle Already Checked Out !');
          return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.vehicleAttendance.vehicleAlreadyCheckedOut);
        }

        // if vehicle session not exist
      } else {
        error('INVALID Vehicle!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.vehicleAttendance.vehicleNotCheckedIn);
      }

      // if vehicle id is invalid
    } else {
      error('The Vehicle ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.vehicleAttendance.invalidVehicleId);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
