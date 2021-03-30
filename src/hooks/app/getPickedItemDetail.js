// controller function

const pickerBoySalesOrderItemMappingModel = require('../../components/picker_app/pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller'); // pickerboy SO mapping ctrl

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
    let orderDetail = await pickerBoySalesOrderItemMappingModel.getPickedItemByPickerOrderId(req.params.pickerBoyOrderMappingId);
    // console.log()
    // get added item detail
    if (orderDetail.success) {
      req.body.orderDetail = orderDetail.data[0];
      // console.log('item detail',orderDetail)
   
        return next()
      
    }else{
error('Order not found.')
      return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR,"Order Not Found.");
    }

    // move on 
  

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
