// controller function
const UserAttendanceCtrl = require('../../components/picker_app/onBoard/app_picker_user_attendance/app_picker_user_attendance.controller'); // app user attendance
const pickerBoySalesOrderMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller'); // pickerboy SO mapping collection  
const stoDetailsCtrl = require('../../components/picker_app/external_purchase_order/stock_transfer_picking_details/stock_transfer_picking_details.controller'); // pickerboy StO mapping collection  

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
    info('Get the item detail !');
    let requestFromUrl = req.url,
    pickStatus,
    responseObj;
   
    if(requestFromUrl.includes('/stocktransfer/')){
      pickStatus = await stoDetailsCtrl.getPickingStatus(req.user._id)
     
   
    }else{
    pickStatus = await pickerBoySalesOrderMappingCtrl.getOrderDetailByPickerBoyId(req.user._id)
  
    }
    console.log(pickStatus)
    if(pickStatus.success){
  
        error('IN PICKING STATE !');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT,'Already In Picking State.Please Complete the onGoing Picking First');

    }else{
    // move on 
next()
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
