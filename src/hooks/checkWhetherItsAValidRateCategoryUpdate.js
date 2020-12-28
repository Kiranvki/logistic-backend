// Controller
const rateCategoryCtrl = require('../components/rate_category/rate_category/rate_category.controller');

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
        info('check whether the Rate Category exists!');
        // creating a valid mongoose type object 
        let objectId = mongoose.Types.ObjectId;

        // get the data
        let rateCategoryName = req.body.rateCategoryDetails.rateCategoryName || '', // rateCategoryName  
            rateCategoryType = req.body.rateCategoryDetails.rateCategoryType || '', // rateCategoryType  
            fixedRentalAmount = req.body.rateCategoryDetails.fixedRentalAmount || '',
            includedAmount = req.body.rateCategoryDetails.includedAmount, // includedAmount  
            includedDistance = req.body.rateCategoryDetails.includedDistance, // includedDistance  
            additionalAmount = req.body.rateCategoryDetails.additionalAmount,

            // get the rate category id from params
            rateCategoryId = req.params.rateCategoryId,

            isNotChanged = [],
            toChangeObject = []; // 

        if (objectId.isValid(rateCategoryId)) {
            // check whether the document type already exist or not 
            let getBrandDetails = await rateCategoryCtrl.getDetails(rateCategoryId);

            // if asm details fetched successfully
            if (getBrandDetails.success) {
                info('VALID rateCategory!');

                // check whether the field values are changed or not 
                if (rateCategoryName && rateCategoryName == getBrandDetails.data.rateCategoryDetails.rateCategoryName) isNotChanged.push('rateCategoryName');
                else if (rateCategoryName) toChangeObject = { ...toChangeObject, 'rateCategoryName': rateCategoryName }
                if (rateCategoryType && rateCategoryType == getBrandDetails.data.rateCategoryDetails.rateCategoryType) isNotChanged.push('rateCategoryType')
                else if (rateCategoryType) toChangeObject = { ...toChangeObject, 'rateCategoryType': rateCategoryType }
                if (fixedRentalAmount && fixedRentalAmount == getBrandDetails.data.rateCategoryDetails.fixedRentalAmount) isNotChanged.push('fixedRentalAmount')
                else if (fixedRentalAmount) toChangeObject = { ...toChangeObject, 'fixedRentalAmount': fixedRentalAmount }
                if (includedAmount && includedAmount == getBrandDetails.data.rateCategoryDetails.includedAmount) isNotChanged.push('includedAmount');
                else if (includedAmount) toChangeObject = { ...toChangeObject, 'includedAmount': includedAmount }
                if (includedDistance && includedDistance == getBrandDetails.data.rateCategoryDetails.includedDistance) isNotChanged.push('includedDistance')
                else if (includedDistance) toChangeObject = { ...toChangeObject, 'includedDistance': includedDistance }
                if (additionalAmount && additionalAmount == getBrandDetails.data.rateCategoryDetails.additionalAmount) isNotChanged.push('additionalAmount')
                else if (additionalAmount) toChangeObject = { ...toChangeObject, 'additionalAmount': additionalAmount }

                // including it to request body 
                req.body.toChangeObject = toChangeObject;
                req.body.isNotChanged = isNotChanged;
                req.body.rateCategoryDataFromDb = getBrandDetails.data.rateCategoryDetails;

                // if there is nothing to change
                if (isNotChanged.length)
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.rateCategory.dataIsNotChanged, req.body.isNotChanged);
                else next(); // move on

                // invalid Brand
            } else {
                error('INVALID Rate Category!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.rateCategory.rateCategoryIdInvalidEitherDeletedOrDeactivated);
            }

            // asm id is invalid 
        } else {
            error('The Rate Category ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.rateCategory.invalidRateCategoryId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
