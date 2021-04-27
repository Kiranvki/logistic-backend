// controller function

const pickerBoySalesOrderItemMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller'); // pickerboy SO Item mapping ctrl
const pickerBoySalesOrderMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller'); // pickerboy SO mapping ctrl

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

    // get all the salesman who are not checked out 
  
    let deliveryNumber = await pickerBoySalesOrderMappingCtrl.getDeliveryNumberByPickerOrderId(req.params.pickerBoyOrderMappingId)
  
    console.log('deliveryNumber',deliveryNumber)
    if (deliveryNumber.success) {
      
      
      req.body.deliveryNumber = deliveryNumber['data']['delivery_no']
      
   
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
