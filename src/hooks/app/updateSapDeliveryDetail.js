// Controller
//const pickerBoyCtrl = require('../../components/picker_app/employee/picker_boy/picker_boy.controller');
const pickerBoyOrderMappingModel = require('../../components/picker_app/pickerboy_salesorder_mapping/models/pickerboy_salesorder_mapping.model');
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
        info('Updating SAP delivery Detail to DB !');

        let pickerBoyOrderMappingId = req.params.pickerBoyOrderMappingId, // type 
            deliveryDetail = req.body.delivery_detail['data'] || undefined; // getting the SAP delivery Detail
            
            // req.body.delivery_detail['data']
        // getting the pickerboy details 
        // let pickerBoyDetails = await pickerBoyCtrl.getDetailsUsingField(parseInt(mobileNumber) || email);
        // pickerBoyOrderMappingModel
        // if Picker Boy details not found
        console.log('success',deliveryDetail,pickerBoyOrderMappingId)
        if (deliveryDetail) {
            info('Delivery Detail Updated Succesfully.')
            req.body.delivery_detail =  await pickerBoyOrderMappingModel.updateDeliveryStatus(pickerBoyOrderMappingId,deliveryDetail.delivery_no,deliveryDetail.remarks)
           console.log('sucess',req.body.delivery_detail)
            return next();
        } else {
            error('Failed to update !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, 'Failed To update delivery.');
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
