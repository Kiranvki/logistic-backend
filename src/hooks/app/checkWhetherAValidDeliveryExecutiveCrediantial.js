// Controller
const deliveryCtrl = require('../../components/employee/delivery_executive/delivery_executive.controller');

// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const {
    error,
    info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
    try {
        info('Check whether the delivery executive exist or not !');

        let type = req.params.type, // type 
            mobileNumber = req.body.mobileNumber || undefined, // getting the mobile number 
            email = req.body.email || undefined; // getting the email 

        // getting the pickerboy details 
        let deliveryexecutiveDetails = await deliveryCtrl.getDetailsDeliveryUsingField(parseInt(mobileNumber) || email);
        
        // if Delivery Executive details not found
        if (deliveryexecutiveDetails.success) {
            info('Delivery Executive Details Fetched Successfully')
            req.body.deliveryexecutiveDetails = deliveryexecutiveDetails.data;
         
            console.log("deliveryexecutiveDetails",req.body.deliveryexecutiveDetails);
            return next();
        } else {
            error('Invalid Delivery Executive !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserOnBoard.invalidUserCred(type == 'sms' ? 'mobile number' : 'email'));
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
