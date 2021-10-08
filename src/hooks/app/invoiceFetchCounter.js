// Controller
//const pickerBoyCtrl = require('../../components/picker_app/employee/picker_boy/picker_boy.controller');
const invoiceMasterModel = require('../../components/picker_app/invoice_master/models/invoice_master.model');
// Responses & others utils 

const pickerBoyOrderMappingModel = require('../../components/picker_app/pickerboy_salesorder_mapping/models/pickerboy_salesorder_mapping.model')
const invoicePickerBoySalesOrderMappingctrl = require('../../components/picker_app/invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller')
const Response = require('../../responses/response');
const _ = require('lodash');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const {
    error,
    info
} = require('../../utils').logging;



// exporting the hooks 
module.exports = async (req, res, next) => {
    try {
        info('Updating SAP Invoice Count to DB !');
        
        let pickerBoyOrderMappingId = req.params.pickerBoyOrderMappingId; // type 


        // console.log('success invoice',invoiceObj)
        if (req.body.invDetail) {
           
            // invoice update here query
           
           
           



   
          await pickerBoyOrderMappingModel.updateInvoiceStatus(pickerBoyOrderMappingId)
          info('Invoice Fetch Status Updated Succesfully.')

            return next();
        } else {
            error('Failed to update fetch Counter !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, "Failed to Update Fetch Counter.");
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
