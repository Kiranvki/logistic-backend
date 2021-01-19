// Controller
const securityGuardCtrl = require('../components/employee/security_guard/security_guard.controller');

// Responses & others utils 
const mongoose = require('mongoose');
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const _ = require('lodash');
const {
    error,
    info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
    try {
        info('check whether the employee exists!');

        //formatting the fullname
        if (req.body.fullName) {
            req.body.fullName = req.body.fullName.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
        // creating a valid mongoose type object 
        let objectId = mongoose.Types.ObjectId;

        // get the data
        let fullName = req.body.fullName, // fullName  
            contactMobile = req.body.contactMobile, // contactMobile  
            altContactMobile = req.body.altContactMobile,
            email = req.body.email, // email  
            altEmail = req.body.altEmail, // email  
            managerName = req.body.managerName,


            // get the employee id from params
            employeeId = req.params.employeeId,
            employeeType = req.params.employeeType,
            isNotChanged = [],
            toChangeObject = []; // 

        if (objectId.isValid(employeeId)) {
            // check whether the document type already exist or not 
            let getBrandDetails = await securityGuardCtrl.getEmployeeDetails(employeeId, employeeType);

            // if employee details fetched successfully
            if (getBrandDetails.success) {
                info('VALID Employee Id!');

                // check whether the field values are changed or not 
                if (fullName && fullName == getBrandDetails.data.fullName) isNotChanged.push('fullName');
                else if (fullName) toChangeObject = { ...toChangeObject, 'fullName': fullName }
                if (contactMobile && contactMobile == getBrandDetails.data.contactMobile) isNotChanged.push('contactMobile')
                else if (contactMobile) toChangeObject = { ...toChangeObject, 'contactMobile': contactMobile }
                if (altContactMobile && altContactMobile == getBrandDetails.data.altContactMobile) isNotChanged.push('altContactMobile')
                else if (altContactMobile) toChangeObject = { ...toChangeObject, 'altContactMobile': altContactMobile }
                if (email && email == getBrandDetails.data.email) isNotChanged.push('email');
                else if (email) toChangeObject = { ...toChangeObject, 'email': email }
                if (altEmail && altEmail == getBrandDetails.data.altEmail) isNotChanged.push('altEmail')
                else if (altEmail) toChangeObject = { ...toChangeObject, 'altEmail': altEmail }
                if (managerName && managerName == getBrandDetails.data.managerName) isNotChanged.push('managerName')
                else if (managerName) toChangeObject = { ...toChangeObject, 'managerName': managerName }

                // including it to request body 
                req.body.toChangeObject = toChangeObject;
                req.body.isNotChanged = isNotChanged;

                // if there is nothing to change
                if (isNotChanged.length)
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.vehicle.dataIsNotChanged, req.body.isNotChanged);
                else next(); // move on

                // invalid Employee
            } else {
                error('INVALID Employee!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidEmployeeId);
            }

            // asm id is invalid 
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
