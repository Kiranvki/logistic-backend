// Controller
const pickerSalesOrderItemMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

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
        info('Check whether the item alread added for the saleOrderId or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let mappingId = req.body.pickerBoySalesOrderMappingId || req.params.pickerBoySalesOrderMappingId || req.body.stoPickingId || req.params.stoPickingId, // get the pickerBoySalesOrderMappingId
        quantity = req.body.quantity || req.body.qty
        let item_no = req.body.item_no; //get the itemId
        // mongoose valid id 
        if (objectId.isValid(mappingId)) {

            // if Item qty greater than 0
            if (parseInt(quantity)>0) {
                info('Item Quantity is valid!')
                next();
            } else {
                error('Invalid Item Quantity!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.invalidItemQuantity);
            }
        } else {
            error('Invalid Item Number !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.invalidSalesOrderId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
