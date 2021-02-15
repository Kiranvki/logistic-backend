// controller forget password 
const BaseController = require('../../../baseController');
const Model = require('./models/app_picker_user_attendance.model');
const camelCase = require('camelcase');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../../../../utils').logging;
const _ = require('lodash');
const moment = require('moment');

// getting the model 
class userController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.appUserAttendance;
  }

  // checkIn User
  checkInUser = async (req, res) => {
    try {
      info('Checking In User !');

      let user = req.user, // user 
        pickerBoyId = user._id, // salesman Id
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
        userId: mongoose.Types.ObjectId(pickerBoyId),
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
      info('Checking Out User !');

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
  getDetails = async (salesmanId, startDate, endDate) => {
    try {
      info('Get Details !');

      // get the attendance of the salesman 
      return Model.aggregate([{
        $match: {
          'userId': mongoose.Types.ObjectId(salesmanId),
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

  // get the attendance for the given month
  getUserAttendanceForAMonth = async (req, res) => {
    try {
      info('get the user attendance for a month !');

      let user = req.user, // user 
        salesmanId = user._id, // salesman Id
        attendanceSheet = [], // attendance sheet 
        attendanceWithWeekSorted = [], // attendance sheet with week sorted 
        endDateOfTheMonth = req.body.endDateOfTheMonth, // end date of the month
        startDateOfTheMonth = req.body.startDateOfTheMonth; //  start date of the month

      // get the end date 
      let endDate = new Date(endDateOfTheMonth).getDate();

      // get the attendance for each salesman 
      let attendanceForTheMonth = await Model.aggregate([{
        $match: {
          'userId': mongoose.Types.ObjectId(salesmanId),
          'dateOfAttendance': {
            '$gt': startDateOfTheMonth,
            '$lte': endDateOfTheMonth
          },
          'status': 1,
          'isDeleted': 0
        }
      }, {
        $project: {
          'dateOfAttendance': { $dateToString: { format: "%d-%m-%Y", date: "$dateOfAttendance", timezone: "+05:30" } },
          'date': { $dateToString: { format: "%d", date: "$dateOfAttendance", timezone: "+05:30" } },
          'attendanceLog': 1,
          'status': 1,
          'isDeleted': 1
        }
      }]).allowDiskUse(true);

      // getting the start time and end time 
      for (let i = 1; i <= endDate; i++) {
        let date = moment(startDateOfTheMonth).add(i - 1, 'days').format('DD-MM-YYYY');
        let attendanceLogArray = [];
        // check whether the user has attended on that day or not 
        let isAttended = attendanceForTheMonth.filter((data) => {
          return (parseInt(data.date) == i);
        })[0];

        // if is attended
        if (isAttended && !_.isEmpty(isAttended)) {

          // pushing the attendance log 
          for (let j = 0; j < isAttended.attendanceLog.length; j++) {
            attendanceLogArray.push({
              checkInTime: moment.utc(moment.duration(isAttended.attendanceLog[j].checkInTimeInMins, "minutes").asMilliseconds()).utcOffset("+05:30").format("HH:mm"),
              checkOutTimeIn: isAttended.attendanceLog[j].checkOutTimeInMins ? moment.utc(moment.duration(isAttended.attendanceLog[j].checkOutTimeInMins, "minutes").asMilliseconds()).utcOffset("+05:30").format("HH:mm") : 'N/A',
              totalTimeTaken: isAttended.attendanceLog[j].totalWorkingInMins
            })
          }

          // push into the attendance sheet
          attendanceSheet.push({
            isAttended: 1,
            date: date,
            week: moment(date, "DD-MM-YYYY").week(),
            attendanceLogArray: attendanceLogArray,
            totalWorkingForTheDayInMins: _.sumBy(attendanceLogArray, 'totalTimeTaken')
          })
        } else {
          let isAfter = moment(date, "DD-MM-YYYY").isAfter(new Date())
          if (!isAfter)
            attendanceSheet.push({
              isAttended: 0,
              attendanceLogArray: [],
              totalWorkingForTheDayInMins: 0,
              week: moment(date, "DD-MM-YYYY").week(),
              date: date
            })
        }
      }

        // weekly grouped data
        let weeklyGroupedData = _.groupBy(attendanceSheet, 'week');
        let keys = Object.keys(weeklyGroupedData);
  
        // keys length
        for (let i = 0; i < keys.length; i++) {
  
          // attendance sheet 
          attendanceWithWeekSorted.push({
            'week': keys[i],
            'attendanceSheet': weeklyGroupedData[keys[i]]
          });
        }

       // check user attendance sheet
       if (attendanceWithWeekSorted && attendanceWithWeekSorted.length) {
        // success response 
        return this.success(req, res, this.status.HTTP_OK, attendanceWithWeekSorted, this.messageTypes.userAttendanceFetchedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.userAttendanceFetchError);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }



  // get the attendance detail for the day 
  getAttendanceDetailsForADay = async (pickerBoyId, startDate, endDate) => {
    try {
      info('Get Details !');

      // get the attendance of the picker boy
      return Model.aggregate([{
        $match: {
          'userId': mongoose.Types.ObjectId(pickerBoyId),
          'dateOfAttendance': {
            $gte: startDate,
            $lte: endDate
          }
        }
      }, {
        '$project': {
          'userId': 1,
          'dateOfAttendance': 1,
          'attendanceLog': 1,
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



  // get all the users who are not checked out
  getAllNonCheckedOutUsers = async () => {
    try {
      info('Get All the Non Checked Out Users !');

      // get the attendance of the picker boy 
      return Model.aggregate([{
        $match: {
          'status': 1,
          'isDeleted': 0
        }
      }, {
        '$project': {
          'userId': 1,
          'dateOfAttendance': { $dateToString: { format: "%m-%d-%Y", date: "$dateOfAttendance", timezone: "+05:30" } },
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
        '$sort': {
          'dateOfAttendance': -1
        }
      }, {
        '$match': {
          'attendanceLog': {
            $exists: true,
            $not: { $size: 0 }
          }
        }
      }, {
        $group: {
          _id: '$dateOfAttendance',
          data: {
            $push: '$$ROOT'
          }
          // 'attendanceLog': { $push: '$attendanceLog' },
          // 'userId': { $push: '$userId' }
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length) {
            return {
              success: true,
              data: res
            };
          } else return {
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

  // check out User
  checkOutUserManually = async (pickerBoyId, attendanceId, attendanceLogId, checkInTimeInMins, date, hr, min) => {
    try {
      info('Checking Out User !');

      let user = pickerBoyId, // user 
        todaysDate = date; // todays date

      let timeOfTheDayInMins = parseInt(hr) * 60 + parseInt(min); // getting the time in mins 

      // inserting the new user into the db
      let updateObj = {
        'attendanceLog.$[attendanceLog].checkOutDate': todaysDate,
        'attendanceLog.$[attendanceLog].checkOutTimeInMins': parseInt(timeOfTheDayInMins),
        'attendanceLog.$[attendanceLog].isCheckedOut': 1,
        'attendanceLog.$[attendanceLog].totalWorkingInMins': parseInt(timeOfTheDayInMins) - parseInt(checkInTimeInMins)
      };

      // update the data 
      let isUpdated = await Model.update({
        _id: attendanceId,
        userId: user
      }, {
        $set: {
          ...updateObj
        }
      }, {
        'arrayFilters': [{
          'attendanceLog._id': mongoose.Types.ObjectId(attendanceLogId)
        }]
      })

      // return success
      return {
        success: true,
        data: isUpdated
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // auto checkout 
  autoCheckout = async (req, res) => {
    try {
      info('Checking Out User !');

      // success response 
      return this.success(req, res, this.status.HTTP_OK, {
        totalNumberOfUserCheckedOut: req.body.userCheckedOut || []
      }, this.messageTypes.userCheckedOut);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
}

// exporting the modules 
module.exports = new userController();
