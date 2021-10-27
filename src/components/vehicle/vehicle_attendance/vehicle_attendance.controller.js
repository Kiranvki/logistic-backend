// controller forget password 
const BaseController = require('../../baseController');
const Model = require('./models/vehicle_attendance.model');
const camelCase = require('camelcase');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../../../utils').logging;
const _ = require('lodash');
const moment = require('moment');

// getting the model 
class userController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.vehicleAttendance;
  }

  // checkIn Vehicle
  checkInVehicle = async (req, res) => {
    try {
      info('Checking In Vehicle !');

      let
        // user = req.user, // Vehicle 
        driverName = req.body.driverName,
        vehicleId = req.params.vehicleId, // Vehicle Id
        todaysDate = moment().set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate(); // today date 

      let checkInTimeInHour = parseInt(req.body.checkInTimeInHour); // getting the check in hour
      let checkInTimeInMins = parseInt(req.body.checkInTimeInMins); // getting the check in min

      let timeOfTheDayInMins = parseInt(checkInTimeInHour) * 60 + parseInt(checkInTimeInMins); // getting the time in mins 

      let attendanceLog = [{
        checkInDate: todaysDate,
        checkInTimeInMins: parseInt(timeOfTheDayInMins),
        driverName: driverName,
        createdDate: new Date()
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
        vehicleId: mongoose.Types.ObjectId(vehicleId),
        dateOfAttendance: {
          '$gte': startOfTheDay,
          '$lte': endOfTheDay
        },
      }, {
        $set: {
          dateOfAttendance: todaysDate,
          status: 1,
          isDeleted: 0,

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

  // check out Vehicle
  checkOutVehicle = async (req, res) => {
    try {
      info('Checking Out Vehicle !');

      let vehicleId = req.params.vehicleId, // Vehicle Id
        checkOutDate = moment(req.body.checkOutDate, 'DD-MM-YYYY').set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate();
      // let user = req.user, // user 
      //   todaysDate = new Date(); // todays date

      let checkOutTimeInHour = parseInt(req.body.checkOutTimeInHour); // getting the check out hour
      let checkOutTimeInMins = parseInt(req.body.checkOutTimeInMins); // getting the check out min


      // let todayTimeInHour = moment().format('HH'); // getting the current hour 
      // let todayTimeInMins = moment().format('mm'); // getting the current min
      let timeOfTheDayInMins = parseInt(checkOutTimeInHour) * 60 + parseInt(checkOutTimeInMins); // getting the time in mins 

      // inserting the new user into the db
      let updateObj = {
        'attendanceLog.$[attendanceLog].checkOutDate': checkOutDate,
        'attendanceLog.$[attendanceLog].checkOutTimeInMins': parseInt(timeOfTheDayInMins),
        'attendanceLog.$[attendanceLog].isCheckedOut': 1,
        'attendanceLog.$[attendanceLog].totalWorkingInMins': parseInt(timeOfTheDayInMins) - parseInt(req.body.checkInTimeInMins)
      };

      // update the data 
      let isUpdated = await Model.update({
        _id: req.body.attendanceId,
        vehicleId: vehicleId
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
        return this.success(req, res, this.status.HTTP_OK, dataToSend, this.messageTypes.vehicleCheckedOut);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.vehicleCheckedNotOut);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get details
  getDetails = async (vehicleId, startDate, endDate) => {
    try {
      info('Get Details !');

      // get the attendance of the vehicle 
      return Model.aggregate([{
        $match: {
          'vehicleId': mongoose.Types.ObjectId(vehicleId),
          'dateOfAttendance': {
            $gte: startDate,
            $lte: endDate
          }
        }
      }, {
        '$project': {
          'vehicleId': 1,
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
  getVehicleAttendanceForAMonth = async (req, res) => {
    try {
      info('get the vehicle attendance for a month !');

      let
        //user = req.user, // user 
        vehicleId = req.params.vehicleId, // vehicle Id
        attendanceSheet = [], // attendance sheet 
        endDateOfTheMonth = req.body.endDateOfTheMonth, // end date of the month
        startDateOfTheMonth = req.body.startDateOfTheMonth; //  start date of the month

      // get the end date 
      let endDate = new Date(endDateOfTheMonth).getDate();

      // get the attendance for each salesman 
      let attendanceForTheMonth = await Model.aggregate([{
        $match: {
          'vehicleId': mongoose.Types.ObjectId(vehicleId),
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
          'isDeleted': 1,
          'driverName': 1
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
              // checkInTime: moment.utc(moment.duration(isAttended.attendanceLog[j].checkInTimeInMins, "minutes").asMilliseconds()).utcOffset("+05:30").format("HH:mm"),
              // checkOutTimeIn: isAttended.attendanceLog[j].checkOutTimeInMins ? moment.utc(moment.duration(isAttended.attendanceLog[j].checkOutTimeInMins, "minutes").asMilliseconds()).utcOffset("+05:30").format("HH:mm") : 'N/A',
              // totalTimeTaken: isAttended.attendanceLog[j].totalWorkingInMins
              checkInTime: moment.utc(moment.duration(isAttended.attendanceLog[j].checkInTimeInMins, "minutes").asMilliseconds()).format("HH:mm"),
              checkOutTimeIn: isAttended.attendanceLog[j].checkOutTimeInMins ? moment.utc(moment.duration(isAttended.attendanceLog[j].checkOutTimeInMins, "minutes").asMilliseconds()).format("HH:mm") : 'N/A',
              totalTimeTaken: isAttended.attendanceLog[j].totalWorkingInMins,
              driverName: isAttended.attendanceLog[j].driverName ? isAttended.attendanceLog[j].driverName : 'N/A',
              checkInDate: moment.utc(isAttended.attendanceLog[j].checkInDate).utcOffset("+05:30").format('DD-MM-YYYY'),
              checkOutDate: isAttended.attendanceLog[j].checkOutDate ? moment.utc(isAttended.attendanceLog[j].checkOutDate).utcOffset("+05:30").format('DD-MM-YYYY') : 'N/A'
            })
          }

          // push into the attendance sheet
          attendanceSheet.push({
            isAttended: 1,
            date: date,
            attendanceLogArray: attendanceLogArray,
            totalWorkingForTheDayInMins: _.sumBy(attendanceLogArray, 'totalTimeTaken')
          })
        } else {
          attendanceSheet.push({
            isAttended: 0,
            attendanceLogArray: [],
            date: date
          })
        }
      }

      // check user attendance sheet
      if (attendanceSheet && attendanceSheet.length) {
        // success response 
        return this.success(req, res, this.status.HTTP_OK, attendanceSheet, this.messageTypes.vehicleAttendanceFetchedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.vehicleAttendanceFetchError);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
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


  // checkIn Vehicle
  getAllCheckInVehicleIds = async () => {
    try {
      info('Getting all check-in Vehicle Id!');

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

      return Model.find({
        'status': 1,
        'isDeleted': 0,
        'attendanceLog.isCheckedOut': 0,
        'dateOfAttendance': {
          '$gte': startOfTheDay,
          '$lte': endOfTheDay
        },
      })
        .lean()
        .then((res) => {
          if (res && res.length) {
            return {
              success: true,
              data: res.map((data) => data.vehicleId)
            }
          } else {
            error('Error Searching Data in Vehicle attendance DB!');
            return {
              success: false
            }
          }
        }).catch(err => {
          error(err);
          return {
            success: false,
            error: err
          }
        });

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
      }
    }
  }

}

// exporting the modules 
module.exports = new userController();
