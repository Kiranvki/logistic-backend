// controller forget password 
const BaseController = require('../../../baseController');
const Model = require('./models/app_delivery_user_attendance.model');
const camelCase = require('camelcase');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../../../../utils').logging;
const _ = require('lodash');
const moment = require('moment');

// getting the model 
class DeliveryuserController extends BaseController {
    // constructor 
    constructor() {
      super();
      this.messageTypes = this.messageTypes.appUserAttendance;
    }

    
  // checkIn User
  checkInUser = async (req, res) => {
    try {
      info('Checking In Delivery Executive User !');

      let user = req.user, // user 
        deliveryId = user._id, // Delivery Executive Id
        todaysDate = moment().set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate(); // today date 

      let todayTimeInHour = moment().format('HH'); // getting the current hour 
      let todayTimeInMins = moment().format('mm'); // getting the current min
      let timeOfTheDayInMins = parseInt(todayTimeInHour) * 60 + parseInt(todayTimeInMins); // getting the time in mins 

      let attendanceLog = [{
        checkInDate: new Date(),
        checkInTimeInMins: parseInt(timeOfTheDayInMins)
      }];

      let startOfTheDay = moment().set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      // getting the end of the day 
      let endOfTheDay = moment().set({
        h: 24,
        m: 24,
        s: 0,
        millisecond: 0
      }).toDate();

      // inserting the new user into the db
      let isInserted = await Model.findOneAndUpdate({
        userId: mongoose.Types.ObjectId(deliveryId),
        dateOfAttendance: {
          '$gte': startOfTheDay,
          '$lte': endOfTheDay
        },
      }, {
        $set: {
          dateOfAttendance: todaysDate,
          status: 1,
          isDeleted: 0
        },
        $push: {
          attendanceLog: attendanceLog
        }
      }, {
        upsert: true,
        new: true
      }).then((data) => {
        if (data) {
          let response = (data).toObject();
          let totalWorkingInMins = 0;
          // get the total working in mins 
          if (data.attendanceLog && data.attendanceLog.length)
            totalWorkingInMins = _.sumBy(data.attendanceLog, 'totalWorkingInMins')
          return {
            ...response,
            isFirstCheckedIn: data.attendanceLog ? data.attendanceLog.length ? 1 : 0 : 0,
            attendanceLog: data.attendanceLog ? data.attendanceLog.length ? data.attendanceLog[data.attendanceLog.length - 1] : [] : [],
            totalWorkingInMinsTillLastCheckOut: totalWorkingInMins || 0
          }
        } else return {
          ...response,
          isFirstCheckedIn: 0,
          attendanceLog: {},
          totalWorkingInMinsTillLastCheckOut: 0
        };
      });

      // is inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        // success response 
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.attendanceMarkedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.attendanceNotMarkedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

    // check out User
    checkOutUser = async (req, res) => {
        try {
          info('Checking Out Delivery Executive User !');
    
          let user = req.user, // user 
            todaysDate = new Date(); // todays date
    
          let todayTimeInHour = moment().format('HH'); // getting the current hour 
          let todayTimeInMins = moment().format('mm'); // getting the current min
          let timeOfTheDayInMins = parseInt(todayTimeInHour) * 60 + parseInt(todayTimeInMins); // getting the time in mins 
    
          // inserting the new user into the db
          let updateObj = {
            'attendanceLog.$[attendanceLog].checkOutDate': todaysDate,
            'attendanceLog.$[attendanceLog].checkOutTimeInMins': parseInt(timeOfTheDayInMins),
            'attendanceLog.$[attendanceLog].isCheckedOut': 1,
            'attendanceLog.$[attendanceLog].totalWorkingInMins': parseInt(timeOfTheDayInMins) - parseInt(req.body.checkInTimeInMins)
          };
    
          // update the data 
          let isUpdated = await Model.update({
            _id: req.body.attendanceId,
            userId: user
          }, {
            $set: {
              ...updateObj
            }
          }, {
            'arrayFilters': [{
              'attendanceLog._id': mongoose.Types.ObjectId(req.body.attendanceLogId)
            }]
          })
    
          // is inserted 
          if (isUpdated && !_.isEmpty(isUpdated)) {
    
            // inserting the new user into the db
            let dataToSend = await Model.findOne({
              _id: req.body.attendanceId,
            }).then((data) => {
              if (data) {
                let response = (data).toObject();
                let totalWorkingInMins = 0;
                // get the total working in mins 
                if (data.attendanceLog && data.attendanceLog.length)
                  totalWorkingInMins = _.sumBy(data.attendanceLog, 'totalWorkingInMins')
                return {
                  ...response,
                  isFirstCheckedIn: data.attendanceLog ? data.attendanceLog.length ? 1 : 0 : 0,
                  attendanceLog: data.attendanceLog ? data.attendanceLog.length ? data.attendanceLog[data.attendanceLog.length - 1] : [] : [],
                  totalWorkingInMinsTillLastCheckOut: totalWorkingInMins || 0
                }
              } else return {
                ...response,
                isFirstCheckedIn: 0,
                attendanceLog: {},
                totalWorkingInMinsTillLastCheckOut: 0
              };
            });
    
            // success response 
            return this.success(req, res, this.status.HTTP_OK, dataToSend, this.messageTypes.userCheckedOut);
          } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.userCheckedNotOut);
    
          // catch any runtime error 
        } catch (err) {
          error(err);
          this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
      }
      
  // get details
  getDetails = async (deliveryId, startDate, endDate) => {
    try {
      info('Get Delivery Executive Attendance Details !');

      // get the attendance of the salesman 
      return Model.aggregate([{
        $match: {
          'userId': mongoose.Types.ObjectId(deliveryId),
          'dateOfAttendance': {
            $gte: startDate,
            $lte: endDate
          }
        }
      }, {
        '$project': {
          'userId': 1,
          'dateOfAttendance': 1,
          'attendanceLog': {
            $filter: {
              input: "$attendanceLog",
              as: "attendance",
              cond: {
                $and: [{
                  $eq: ["$$attendance.isCheckedOut", 0]
                }, {
                  $eq: [
                    "$$attendance.status", 1
                  ]
                }]
              }
            }
          },
        }
      }, {
        '$match': {
          'attendanceLog': {
            $exists: true
          }
        }
      }]).allowDiskUse()
        .then((res) => {
          if (res && res.length) return {
            success: true,
            data: res[0]
          }
          else return {
            success: false
          }
        })
        .catch((err) => {
          return {
            success: false,
            error: err
          }
        });

      // catch any internal error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }
}

    // exporting the modules 
module.exports = new DeliveryuserController();
  