const employeeCtrl = require('../components/employee/security_guard/security_guard.controller');

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const _ = require('lodash');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the employee Id is valid or not!');
    const ObjectId = mongoose.Types.ObjectId; // object id
    let employeeId = req.params.employeeId,  // get the employee Id 
      employeeType = req.params.employeeType;   // get the employee type

    if (ObjectId.isValid(employeeId)) {
      // check whether the name is unique or not 
      let isValid = await employeeCtrl.getEmployeeDetails(employeeId, employeeType);

      // if name exists
      if (isValid.success) {
        info('Valid Employee')
        // injecting the data into the request body
        req.body.employeeData = isValid.data;

        // MOVE ON 
        next();
      } else {
        error('Employee ID Not Found !'); // route doesnt exist 
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.employeeIdIsInvalidOrDeactivated);
      }
    } else {
      error('Employee ID is Invalid !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidEmployeeId);

    }


    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};