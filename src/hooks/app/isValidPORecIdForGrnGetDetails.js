// Controller
const poRecievingCtrl = require('../../components/picker_app/purchase_order_recieving_details/purchase_order_recieving_details.controller');

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
        info('Check whether PO Recieving Id is valid or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let poRecievingId = req.params.poRecievingId; // get the sale order id 

        // mongoose valid id 
        if (objectId.isValid(poRecievingId)) {

            // check whether the sale Order id is unique or not
            let poRecievingDetails = await poRecievingCtrl.getForGrnGeneration(poRecievingId)

            // if email is unique
            if (poRecievingDetails.success) {
                info('Valid SaleOrder')
                req.body.poRecievingDetails = poRecievingDetails.data[0]

                next();
            } else {
                error('INVALID Purchase Order recieving ID!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.purchaseOrderIdInvalidEitherDeletedOrDeactivated);
            }
        } else {
            error('The PurchaseOrder recieving ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.invalidPurchaseOrderRecievingId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
