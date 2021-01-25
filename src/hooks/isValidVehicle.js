// Controller
const vehicleCtrl = require('../components/vehicle/vehicle_master/vehicle_master.controller');

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
        info('Check whether the vehicle Id is unique or not!');
        let objectId = mongoose.Types.ObjectId; // object id
        let vehicleId = req.body.vehicleId || req.params.vehicleId; // get the vehicle id 

        // mongoose valid id 
        if (objectId.isValid(vehicleId)) {

            // check whether the email id is unique or not 
            let isValidRole = await vehicleCtrl.getDetails(vehicleId)

            // if email is unique
            if (isValidRole.success) {
                info('Valid vehicle')
                next();
            } else {
                error('INVALID vehicle!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.vehicle.vehicleIdInvalidEitherDeletedOrDeactivated);
            }
        } else {
            error('The vehicle ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.vehicle.invalidVehicleId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
