// Controller
const salesOrderCtrl = require('../../components/sales_order/sales_order/sales_order.controller');

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
        info('Check whether the details exist for the saleOrderId or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let saleOrderId = req.body.saleOrderId || req.params.saleOrderId; // get the sale order id 

        // mongoose valid id 
        if (objectId.isValid(saleOrderId)) {

            // check whether the sale Order id is unique or not
            let isValidSaleOrder = await salesOrderCtrl.getDetails(saleOrderId)

            // if email is unique
            if (isValidSaleOrder.success) {
                info('Valid SaleOrder')
                req.body.saleOrderDetails = isValidSaleOrder.data

                next();
            } else {
                error('INVALID SaleOrder!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.salesOrderIdInvalidEitherDeletedOrDeactivated);
            }
        } else {
            error('The SaleOrder ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.invalidSalesOrderId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
