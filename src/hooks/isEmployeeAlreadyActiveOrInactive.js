// Controller
const securityGuardCtrl = require('../components/employee/security_guard/security_guard.controller');

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const mongoose = require('mongoose');
const {
    error,
    info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
    try {
        info('check whether the employee exists!');
        // object id
        let objectId = mongoose.Types.ObjectId;

        // get the  distributor id
        let employeeId = req.body.employeeId || req.params.employeeId,
            type = req.params.type,
            employeeType = req.params.employeeType;

        // check whether employee id is valid or not
        if (objectId.isValid(employeeId)) {

            // check whether the email id is unique or not 
            let getEmployeeDetails = await securityGuardCtrl.getEmployeeDetails(employeeId, employeeType);

            // check asm is activated
            if (getEmployeeDetails.success) {

                // status is activate
                if (getEmployeeDetails.data.status == 1 && type == 'activate') {
                    error('Employee already Activated !');
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.distributor.distributorAlreadyActivated);
                } else if (getEmployeeDetails.data.status == 0 && type == 'deactivate') {
                    // status is deactivate
                    error('distributor already Deactivated !');
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.distributor.distributorAlreadyDeactivated);
                }
                // move on
                next();

                // invalid distributor id
            } else {
                error('Invalid Employee Id !');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidEmployeeId);
            }

            // Distributor id is invalid
        } else {
            error('The Employee ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidEmployeeId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
