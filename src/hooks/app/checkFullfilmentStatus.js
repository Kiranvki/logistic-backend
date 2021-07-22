// controller function
const UserAttendanceCtrl = require('../../components/picker_app/onBoard/app_picker_user_attendance/app_picker_user_attendance.controller'); // app user attendance
const pickerBoySalesOrderMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller'); // pickerboy SO mapping collection  

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
    info('Checking fullfilment status !');
    let fullfilmentStatus = 2
    let itemDetail = await pickerBoySalesOrderMappingCtrl.getOrderDetail("605ca247c959220ef062ff40");
    console.log(itemDetail)

    // if(itemDetail[0]['salesOrderId']['orderItems']){
    //   itemDetail[0]['salesOrderId']['orderItems']
    // }
   
    // move on 
    return next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
