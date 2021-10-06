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
        info('Check whether the invoice generated and details exist for the stock transfer or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let id = req.body.pickerBoyOrderMappingId || req.params.pickerBoyOrderMappingId || req.params.stoPickingId; // get the sale order id 
        let isValidPickingId,
        requestFromUrl = req.url;

        // mongoose valid id 
        if (objectId.isValid(id)) {

            // check whether the sale Order id is unique or not
            if(requestFromUrl.includes('/stocktransfer/generateInvoice/')){
                isValidPickingId = await stockTransferPickingDetailCtrl.getInvoiceDetails(id)
            }else{
                isValidPickingId = await pickerboySalesOrderMappingController.getInvoiceDetails(id)
            }
            // 
            if (isValidPickingId.success) {
                info('Valid PickerBoy SalesOrder Mapping Id')

                info('Invoice already generated')

                //get the invoice data and respond
              
                // if(isValidPickingId.data.invoiceDetail.invoice.invoiceId && isValidPickingId.data.invoiceDetail.isInvoice ==false){
                 
                 
                    let isInvoiceFetch ='false';
                    if(!isValidPickingId.data.invoiceDetail.invoice.invoiceDbId){
                        isInvoiceFetch = 'true'

                    }
                   
                //     return Response.errors(req, res, StatusCodes.HTTP_FOUND, JSON.stringify({data:isValidPickingId['data']['invoiceDetail'], message:MessageTypes.invoice.invoiceAlreadyDoneButFetchFailed,'isInvoiceFetch':isInvoiceFetch}))
                // }


                // let invoiceData = invoicePickerSO.data[0].invoiceDetails[0];
                return Response.errors(req, res, StatusCodes.HTTP_FOUND, JSON.stringify({data:isValidPickingId['data']['invoiceDetail'], message:MessageTypes.invoice.invoiceAlreadyDone,'isInvoiceFetch':isInvoiceFetch}))






            } else {
                //invoice not created,  creating new one
                next();

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
