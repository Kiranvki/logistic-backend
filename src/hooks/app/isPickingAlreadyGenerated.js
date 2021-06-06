// Controller
const stockTransferPickingDetailCtrl = require('../../components/picker_app/external_purchase_order/stock_transfer_picking_details/stock_transfer_picking_details.controller');
const pickerboySalesOrderMappingController = require('../../components/picker_app/pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');

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
        info('Check whether the invoice generated and details exist for the pickerBoySalesOrderMappingId or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let orderPickingId = req.body.stoPickingId || req.params.stoPickingId || req.params.pickerBoyOrderMappingId || req.body.pickerBoyOrderMappingId; // get the sale order id 
        let isPickingDone,
        requestFromUrl = req.url;
        // mongoose valid id 
        if (objectId.isValid(orderPickingId)) {

            // check whether the Picking is created or not
            if(requestFromUrl.includes('/stocktransfer/generateDelivery/')){
                isPickingDone = await stockTransferPickingDetailCtrl.getPickingDetails(orderPickingId)
            }else{
                isPickingDone = await pickerboySalesOrderMappingController.getPickingDetails(orderPickingId)
            }
            // 
            if (isPickingDone.success) {
                info('Valid PickerBoy STO Mapping Id')

                info('Picking already generated')


                return Response.errors(req, res, StatusCodes.HTTP_FOUND, JSON.stringify({ 'message': MessageTypes.invoice.pickingAlreadyDone, 'data': isPickingDone.data }))






            } else {
                //Picking not created,  creating new one
                next();

            }
        } else {
            error('The PickerBoy STO Mapping Id is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.invalidPickerBoySalesOrderMappingId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
