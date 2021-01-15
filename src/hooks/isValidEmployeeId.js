const employeeCtrl= require('../components/employee/security_guard/security_guard.controller')

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const _ = require('lodash');
const {
  error,
  info
} = require('../utils').logging;

module.exports = async (req, res, next) => {
  try {
    info('Check whether the user email id is unique or not!');

    let employeeId = req.body.employeeId; // get the agency id 

    if (employeeId) {
      // check whether the name is unique or not 
      let isValid = await transporterCtrl.isValid(employeeId);

      // if name exists
      if (isValid.success) {

        // injecting into the request body
        req.body.agencyName = isValid.data.nameToDisplay;

        // MOVE ON 
        next();
      } else {
        error('Employee ID Not Found !'); // route doesnt exist 
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT,  MessageTypes.employee.employeeIdIsInvalidOrDeactivated);
      }
    } else next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};