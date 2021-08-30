

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
                info('Invoice number fetched succesfully')

                info('Invoice already generated')
                req.body.invoice_detail= {'data':{}}

                req.body.invoice_detail['data']['invoice_no'] =   isValidPickingId.data.invoiceDetail.invoice.invoiceId
                next();


               
              






            } else {
                //invoice not created,  creating new one
                return Response.errors(req, res, StatusCodes.HTTP_FOUND, 'Invoice number not available.Please Generate the invoice.');

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
