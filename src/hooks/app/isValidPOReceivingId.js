// Controller
const poReceivingCtrl = require('../../components/picker_app/purchase_order_receiving_details/purchase_order_receiving_details.controller');

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
        info('Check whether PO Receiving Id is valid or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let poReceivingId = req.params.poReceivingId; // get the sale order id 

        // mongoose valid id 
        if (objectId.isValid(poReceivingId)) {

            // check whether the sale Order id is unique or not
            let poReceivingDetails = await poReceivingCtrl.get({
                status:1,
                isDeleted: 0,
                _id:mongoose.Types.ObjectId(poReceivingId) 
              })

            // if email is unique
            if (poReceivingDetails.success) {
                info('Valid SaleOrder')
                req.body.poReceivingDetails = poReceivingDetails.data[0]

                next();
            } else {
                error('INVALID Purchase Order receiving ID!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.purchaseOrderIdInvalidEitherDeletedOrDeactivated);
            }
        } else {
            error('The PurchaseOrder receiving ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.invalidPurchaseOrderReceivingId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
