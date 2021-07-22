// Controller
const stoPickingDetailsCtrl = require('../../components/picker_app/external_purchase_order/stock_transfer_picking_details/stock_transfer_picking_details.controller');

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
        let stoPickingId = req.body.stoPickingId || req.params.stoPickingId; // get the pickerBoySalesOrderMappingId
        let item_no = req.body.item_no; //get the itemId
        // mongoose valid id 
        if (objectId.isValid(stoPickingId)) {

            // check whether the sale Order id is unique or not
            let isValidItemAdded = await stoPickingDetailsCtrl.getAddedItemDetails(stoPickingId, item_no)

            // if Item added or not
            if (!isValidItemAdded.success) {
                info('Item not added')
                next();
            } else {
                error('Item already added!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.itemAlreadyAdded);
            }
        } else {
            error('The STOCK TRANSFER ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.invalidSalesOrderId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
