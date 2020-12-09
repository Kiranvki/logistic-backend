// Controller
const invoicePickerSalesOrderMappingCtrl = require('../../components/picker_app/invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
const invoiceCtrl = require('../../components/picker_app/invoice_master/invoice_master.controller');

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
        let pickerBoySalesOrderMappingId = req.body.pickerBoySalesOrderMappingId || req.params.pickerBoySalesOrderMappingId; // get the sale order id 

        // mongoose valid id 
        if (objectId.isValid(pickerBoySalesOrderMappingId)) {

            // check whether the sale Order id is unique or not
            let isValidPickerSalesOrderId = await pickerSalesOrderMappingCtrl.getDetails(pickerBoySalesOrderMappingId)

            // if email is unique
            if (isValidPickerSalesOrderId.success) {
                info('Valid PickerBoy SalesOrder Mapping Id')
                if (isValidPickerSalesOrderId.data.state == 2) {
                    info('Invoice already generated')

                    //get the invoice data and respond

                    let invoicePickerSO = await invoicePickerSalesOrderMappingCtrl.getInvoiceDetails(pickerBoySalesOrderMappingId)

                } else {
                    req.body.pickerBoySalesOrderMappingDetails = isValidPickerSalesOrderId.data

                    next();
                }

            } else {

                error('INVALID PickerBoy SalesOrder Mapping Id!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.pickerBoySalesOrderIdInvalidEitherDeletedOrDeactivated);
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
