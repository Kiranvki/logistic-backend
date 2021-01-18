//controllers
const securityCtrl = require('../../employee/security_guard/security_guard.controller')
const AttendanceCtrl = require('../onBoard/app_security_guard_attendance/app_security_guard_attendance.controller');

const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/security_profile.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const {
  error,
  info
} = require('../../../utils').logging;

// We are using timeout because the Flow is synchronised and inorder to get the final report we need to wait for 5 secs 
class timeout {
    sleep(ms) {
      return new Promise(resolve => {
        setTimeout(resolve, ms);
      });
    }
  }
  

    
// getting the model 
class securityProfileController extends BaseController {
    // constructor 
    constructor() {
      super();
      this.messageTypes = this.messageTypes.employee;
    }

    // do something 
    getsecurityUserDetails = async (req, res) => {
    try {
      info('Get Security Guard Details !');
      let date = new Date();
      let endOfTheDay = moment(date).set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0
      }).toDate();
      let startOfTheDay = moment(date).set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      // inserting the new user into the db
      let securityDetails = await securityCtrl.getsecurityFullDetails(req.user._id);

      // is inserted 
      if (securityDetails.success && !_.isEmpty(securityDetails.data)) {
        // fetch the attendance 
        let attendanceDetails = await AttendanceCtrl.getAttendanceDetailsForADay(req.user._id, startOfTheDay, endOfTheDay)
          .then((data) => {
            if (data.success) {
              let totalWorkingInMins = 0;
              // get the total working in mins 
              if (data.data.attendanceLog && data.data.attendanceLog.length)
                totalWorkingInMins = _.sumBy(data.data.attendanceLog, 'totalWorkingInMins')
              return {
                isFirstCheckedIn: data.data.attendanceLog ? data.data.attendanceLog.length ? 1 : 0 : 0,
                attendanceLog: data.data.attendanceLog ? data.data.attendanceLog.length ? data.data.attendanceLog[data.data.attendanceLog.length - 1] : [] : [],
                totalWorkingInMinsTillLastCheckOut: totalWorkingInMins
              }
            } else return {
              isFirstCheckedIn: 0,
              attendanceLog: {},
              totalWorkingInMinsTillLastCheckOut: 0
            };
          });

        // success response 
        return this.success(req, res, this.status.HTTP_OK, {
          ...securityDetails.data,
          attendanceDetails: attendanceDetails
        }, this.messageTypes.userDetailsFetchedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.userNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
}

// exporting the modules 
module.exports = new securityProfileController();
