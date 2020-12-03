// Controller
const pickerBoyCtrl = require('../../components/picker_app/employee/picker_boy/picker_boy.controller');

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
        info('Check whether the picker boy exist or not !');

        let type = req.params.type, // type 
            mobileNumber = req.body.mobileNumber || undefined, // getting the mobile number 
            email = req.body.email || undefined; // getting the email 

        // getting the pickerboy details 
        let pickerBoyDetails = await pickerBoyCtrl.getDetailsUsingField(parseInt(mobileNumber) || email);

        // if Picker Boy details not found
        if (pickerBoyDetails.success) {
            info('Picker Boy Details Fetched Successfully')
            req.body.pickerBoyDetails = pickerBoyDetails.data;
            return next();
        } else {
            error('Invalid Picker Boy !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserOnBoard.invalidUserCred(type == 'sms' ? 'mobile number' : 'email'));
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
