// controller function

const pickerBoySalesOrderItemMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller'); // pickerboy SO Item mapping ctrl
const pickerBoySalesOrderMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller'); // pickerboy SO mapping ctrl
const stockTransferPickingDetailCtrl = require('../../components/picker_app/external_purchase_order/stock_transfer_picking_details/stock_transfer_picking_details.controller');
// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');

// logging 
const {
  error,
  info
} = require('../../utils').logging;

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * LOGIC: 
 * 1. If the user forgets to checkout then the last sales order picking would be his checkout time.
 * 2. If the user forgets to checkout and dont have any sales order picking time then his checkIn time would be his checkout time.
 */
// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Getting the item detail !');
    let requestFromUrl = req.url,
    deliveryDetail;

    // get the delivery number against which will be generated 
  if(requestFromUrl.includes('/stocktransfer/generateInvoice/')){
    deliveryDetail = await stockTransferPickingDetailCtrl.getDeliveryNumberByPickerOrderId(req.params.stoPickingId)
  }else{
    deliveryDetail = await pickerBoySalesOrderMappingCtrl.getDeliveryNumberByPickerOrderId(req.params.pickerBoyOrderMappingId)
  }
    
    if (deliveryDetail.success) {
      
      info(`Delivery Number is ${deliveryDetail.data['delivery_no']}`)
      req.body.deliveryDetail = deliveryDetail['data']
      
   
        return next()
      
    }else{
      error('DELIVERY NUMBER NOT EXIST.')
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT,"DELIVERY NUMBER NOT EXIST OR INVOICE ALREADY GENERATED!");
    }

    // move on 
  

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
