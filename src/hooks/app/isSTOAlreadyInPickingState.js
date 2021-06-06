// Controller
const stockTransferPickingDetail = require('../../components/picker_app/external_purchase_order/stock_transfer_picking_details/stock_transfer_picking_details.controller');

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
        let orderId = req.body.STOID || req.params.STOID; // get the sale order id 

        // mongoose valid id 
        if (objectId.isValid(orderId)) {

            // check whether the sale Order id is already added or not
            let isValidOrderId = await stockTransferPickingDetail.getOrderDetails(orderId)

            // if sales order Id is not added
            if (!isValidOrderId.success ) {
                info('SalesOrder  Id not added in picking state')
                next();

            } else {
               
                error('SalesOrder Id already added in picking state');
                
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.salesOrderAlreadyAddedInPickerState);
                
                // 
            }
        } else {
            error('The PickerBoy SalesOrder Mapping Id is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.invalidPickerBoySalesOrderMappingId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
