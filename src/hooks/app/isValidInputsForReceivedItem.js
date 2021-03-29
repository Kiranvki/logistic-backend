// Controller
const poReceivingController = require('../../components/picker_app/purchase_order_receiving_details/purchase_order_receiving_details.controller');

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
        info('Check whether quantity entered has valid value');
        let objectId = mongoose.Types.ObjectId; // object id
        let poReceivingId = req.body.poReceivingId; // get the sale order id 
        var material_no = req.params.material_no;
        var received_qty = req.body.received_qty;
        var remarks = req.body.remarks;

        // mongoose valid id 
        if (objectId.isValid(material_no)) {

            // check whether the sale Order id is already added or not
            let poReceivingItemDetails = await poReceivingController.get({
                _id: mongoose.Types.ObjectId(poReceivingId),
                "item._id": mongoose.Types.ObjectId(material_no),
                receivingStatus:4
              })

            // if sales order Id is not added
            if (poReceivingItemDetails.success && poReceivingItemDetails.data&& poReceivingItemDetails.data.length) {
                if(poReceivingItemDetails.data[0].item[0].quantity!=received_qty && !remarks){
                    info('Remarks required');
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.requiredRemark);
                }
                if(poReceivingItemDetails.data[0].item[0].quantity <received_qty){
                    info('Remarks required');
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.receivedQuantityGreaterThanQty);
                }
               req.body.poReceivingItemDetails = poReceivingItemDetails.data[0];
               next()
            } else {
                info('Invalid item id');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.invalidItemId);

            }
        } else {
            error('The ReceiverBoy  Mapping Id is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.receiverBoyIdInvalid);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
