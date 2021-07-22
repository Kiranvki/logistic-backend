// Controller
const pickerSalesOrderMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');

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
        let saleOrderId = req.body.saleOrderId || req.params.saleOrderId; // get the sale order id 

        // mongoose valid id 
        if (objectId.isValid(saleOrderId)) {

            // check whether the sale Order id is already added or not
            let isValidSalesOrderId = await pickerSalesOrderMappingCtrl.getSalesOrderDetails(saleOrderId)

            // if sales order Id is not added
            if (!isValidSalesOrderId.success ) {
                info('SalesOrder  Id not added in picker state')
                next();

            } else {
               
                error('SalesOrder Id already added in picker state');
                
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
