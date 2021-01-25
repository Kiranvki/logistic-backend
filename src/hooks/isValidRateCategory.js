// Controller
const rateCategoryCtrl = require('../components/rate_category/rate_category/rate_category.controller');

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
        info('Check whether the Rate Category Id is unique or not!');
        let objectId = mongoose.Types.ObjectId; // object id
        let rateCategoryId = req.body.rateCategoryId || req.params.rateCategoryId; // get the rateCategory id 

        // mongoose valid id 
        if (objectId.isValid(rateCategoryId)) {

            // check whether the rateCategory id is unique or not
            let isValidRateCategory = await rateCategoryCtrl.getDetails(rateCategoryId)

            // if email is unique
            if (isValidRateCategory.success) {
                info('Valid rateCategory')
                next();
            } else {
                error('INVALID rate Category!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.rateCategory.rateCategoryIdInvalidEitherDeletedOrDeactivated);
            }
        } else {
            error('The rate Category ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.rateCategory.invalidVehicleId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
