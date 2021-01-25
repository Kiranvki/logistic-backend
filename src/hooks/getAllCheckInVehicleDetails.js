// Controller
const vehicleAttendanceCtrl = require('../components/vehicle/vehicle_attendance/vehicle_attendance.controller');

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const {
  error,
  info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Getting all the Check-In vehicle details!');

    // valid vehicle ids for today
    let alreadyCheckInVehicleIds = await vehicleAttendanceCtrl.getAllCheckInVehicleIds();

    // injecting valid salesman id
    req.body.alreadyCheckInVehicleIds = alreadyCheckInVehicleIds.data;
    return next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
