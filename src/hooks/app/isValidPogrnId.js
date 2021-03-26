// Controller
const poGRNCtrl = require('../../components/picker_app/purchase_orderGRN/purchase_orderGRN.controller');

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
        info('Check whether GRN Id is valid or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let grnId = req.params.grnId; // get the sale order id 

        // mongoose valid id 
        if (objectId.isValid(grnId)) {

            // check whether the sale Order id is unique or not
            let grnDet = await poGRNCtrl.get({_id:mongoose.Types.ObjectId(grnId),status:1})

            // if email is unique
            if (grnDet.success) {
                info('Valid Purchase order grn')
                req.body.grnDetails = grnDet.data

                next();
            } else {
                error('INVALID PurchaseOrder GRN!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.grnRecordNotExist);
            }
        } else {
            error('The PurchaseOrder grn ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.purchaseOrder.invalidPurchaseOrderGRNId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
