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
    info('Get the item detail !');

    // get all the salesman who are not checked out 
    let itemDetail = await pickerBoySalesOrderMappingCtrl.getOrderItem('1','1');
    console.log('itemDetail',itemDetail);

    // let userCheckedOut = [];

    // get the last collection time for each app user 
    // if (nonCheckedOutUser.success) {
    //   // get the date
    //   for (let i = 0; i < nonCheckedOutUser.data.length; i++) {
    //     let dateOfAttendanceLog = moment(nonCheckedOutUser.data[i]._id, 'MM-DD-YYYY').add(330, 'minutes').toDate(); // get the date
    //     for (let j = 0; j < nonCheckedOutUser.data[i].data.length; j++) {
    //       let userId = nonCheckedOutUser.data[i].data[j].userId; // get the pickerboy id 
    //       let attendanceId = nonCheckedOutUser.data[i].data[j]._id;
    //       let attendanceLogId = nonCheckedOutUser.data[i].data[j].attendanceLog[0]._id;
    //       let checkInTimeInMins = nonCheckedOutUser.data[i].data[j].attendanceLog[0].checkInTimeInMins;
    //       let date = nonCheckedOutUser.data[i].data[j].attendanceLog[0].checkInDate;

    //       // get the last collection date 
    //       let lastCollectionTime = await pickerBoySalesOrderMappingCtrl.getLastPickingTimeUsingPickerBoyId(userId, dateOfAttendanceLog); // get the last collection time 
    //       let hr = null;
    //       let min = null;
    //       console.log('The last collection jere os --> ', lastCollectionTime)
    //       // check whether the last collection time is present or not   
    //       if (lastCollectionTime.success) {
    //         hr = lastCollectionTime.data.pickingDateHour;
    //         min = lastCollectionTime.data.pickingDateMin;
    //         date = lastCollectionTime.data.pickingDate;
    //       } else {
    //         hr = moment.utc(moment.duration(checkInTimeInMins, "minutes").asMilliseconds()).format("HH");
    //         min = moment.utc(moment.duration(checkInTimeInMins, "minutes").asMilliseconds()).format("mm");
    //       }

    //       let isCheckedOut = await UserAttendanceCtrl.checkOutUserManually(userId, attendanceId, attendanceLogId, checkInTimeInMins, date, hr, min);
    //       if (isCheckedOut) userCheckedOut.push(isCheckedOut);
    //     }
    //   }
    // }

    // get added iten detail
    if (itemDetail) {
      req.body.itemDetail = itemDetail;
    }

    // move on 
    return next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
