// Controller
//const pickerBoyCtrl = require('../../components/picker_app/employee/picker_boy/picker_boy.controller');
const stockPickingDetailsModel = require('../../components/picker_app/external_purchase_order/stock_transfer_picking_details/models/stock_transfer_picking_details.model')
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
        info('Updating SAP Outbound delivery Detail to DB !');

        let stoPickingId = req.params.stoPickingId, // type 
            deliveryDetail = req.body.delivery_detail['data'] || undefined, // getting the SAP delivery Detail
            remarks = deliveryDetail.remarks || 'N/A',
            pickingAllocationResponsePayload = JSON.stringify(req.body.delivery_detail),
            pickingAllocationRequestPayload = JSON.stringify(req.body.obj),
            isSapError = 'DNS', //DNS->delivery_no success
            updateQuery = [{ _id: mongoose.Types.ObjectId(stoPickingId) }, {
                $set: {

                    delivery_no: deliveryDetail.outbound_delivery_no,
                    remarks: remarks,
                    
                    pickingStatus: 3 ,
                    isSapError: isSapError,
                    isItemPicked:false,
                    isStartedPicking:false
                }

            , $inc: { deliveryRetryCount: 1 } ,
                $push: {
                    pickingAllocationResponsePayload: pickingAllocationResponsePayload,
                    pickingAllocationRequestPayload: pickingAllocationRequestPayload,
                   
                }
            }]
         
        
          
       
        if (deliveryDetail) {
            
            info('Delivery Detail Updated Succesfully.')
            await stockPickingDetailsModel.updateStatus(updateQuery)
            
            console.log('sucess',req.body.delivery_detail)
            return next();
        } else {
            error('Failed to update !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.pickerBoySalesOrdereDeliveryNumberUploadFailed);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
