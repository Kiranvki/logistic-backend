// Controller
const poReceivingDetailsCtrl = require('../../components/picker_app/purchase_order_receiving_details/purchase_order_receiving_details.controller');

// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const mongoose = require('mongoose');
const {
    error,
    info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
    try {
        info('Check whether the sales order is already added in picking state');
        let objectId = mongoose.Types.ObjectId; // object id
        let poId = req.params.poId; // get the sale order id 

        // mongoose valid id 
        if (objectId.isValid(poId)) {

            // check whether the sale Order id is already added or not
            let poDetails = await poReceivingDetailsCtrl.getPOReceivingDetails(poId);
            //send error based on record
            // if purchase order Id is not added
            if (poDetails.success, poDetails.data && poDetails.data.length) {
                if(poDetails.data[0].receivingStatus==4||poDetails.data[0].receivingStatus==3){
                    error('Purchase Order already added to receiving state');
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.purchaseOrderAlreadyAddedInReceivingState);
                }
                error('Purchase Order already added to receiving state');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.purchaseOrderGRNalreadygenerated);
            } else {
                next();
            }
        } else {
            error('The PickerBoy purchase order Mapping Id is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.invalidPickerBoyPurchaseOrderMappingId);
        }
        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
