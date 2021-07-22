// Controller
const vehicleCtrl = require('../components/vehicle/vehicle_master/vehicle_master.controller');

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
        info('check whether the Vehicle exists!');
        // creating a valid mongoose type object 
        let objectId = mongoose.Types.ObjectId;

        // get the data
        let regNumber = req.body.regNumber, // regNumber  
            vehicleType = req.body.vehicleType, // vehicleType  
            vehicleModel = req.body.vehicleModel,
            height = req.body.height, // height  
            length = req.body.length, // email  
            breadth = req.body.breadth,
            tonnage = req.body.tonnage,


            // get the vehicle id from params
            vehicleId = req.params.vehicleId,

            isNotChanged = [],
            toChangeObject = []; // 

        if (objectId.isValid(vehicleId)) {
            // check whether the document type already exist or not 
            let getBrandDetails = await vehicleCtrl.getDetails(vehicleId);

            // if asm details fetched successfully
            if (getBrandDetails.success) {
                info('VALID Brand!');

                // check whether the field values are changed or not 
                if (regNumber && regNumber == getBrandDetails.data.regNumber) isNotChanged.push('regNumber');
                else if (regNumber) toChangeObject = { ...toChangeObject, 'regNumber': regNumber }
                if (vehicleType && vehicleType == getBrandDetails.data.vehicleType) isNotChanged.push('vehicleType')
                else if (vehicleType) toChangeObject = { ...toChangeObject, 'vehicleType': vehicleType }
                if (vehicleModel && vehicleModel == getBrandDetails.data.vehicleModel) isNotChanged.push('vehicleModel')
                else if (vehicleModel) toChangeObject = { ...toChangeObject, 'vehicleModel': vehicleModel }
                if (height && height == getBrandDetails.data.height) isNotChanged.push('height');
                else if (height) toChangeObject = { ...toChangeObject, 'height': height }
                if (length && length == getBrandDetails.data.length) isNotChanged.push('length')
                else if (length) toChangeObject = { ...toChangeObject, 'length': length }
                if (breadth && breadth == getBrandDetails.data.breadth) isNotChanged.push('breadth')
                else if (breadth) toChangeObject = { ...toChangeObject, 'breadth': breadth }
                if (tonnage && tonnage == getBrandDetails.data.tonnage) isNotChanged.push('tonnage')
                else if (tonnage) toChangeObject = { ...toChangeObject, 'tonnage': tonnage }


                // including it to request body 
                req.body.toChangeObject = toChangeObject;
                req.body.isNotChanged = isNotChanged;

                // if there is nothing to change
                if (isNotChanged.length)
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.vehicle.dataIsNotChanged, req.body.isNotChanged);
                else next(); // move on

                // invalid Brand
            } else {
                error('INVALID Brand!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.vehicle.vehicleIdInvalidEitherDeletedOrDeactivated);
            }

            // asm id is invalid 
        } else {
            error('The Brand ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidAsmId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
