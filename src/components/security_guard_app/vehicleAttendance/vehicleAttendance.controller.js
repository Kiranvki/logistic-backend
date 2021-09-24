const BaseController = require("../../baseController");
const BasicCtrl = require("../../basic_config/basic_config.controller");
const masterModel = require("../../vehicle/vehicle_master/models/vehicle_master.model");
const attendanceModel = require("../../vehicle/vehicle_attendance/models/vehicle_attendance.model");

const camelCase = require("camelcase");
const mongoose = require("mongoose");
const { error, info } = require("../../../utils").logging;
const _ = require("lodash");
const moment = require("moment");

class vehicleInfoController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.vehicle;
  }

  // checkIn Vehicle
  checkInVehicle = async (req, res) => {
    try {
      info("Checking In Vehicle !");

      let // user = req.user, // Vehicle
        driverName = req.body.driverName,
        vehicleId = req.params.vehicleId, // Vehicle Id
        todaysDate = moment()
          .set({
            h: 0,
            m: 0,
            s: 0,
            millisecond: 0,
          })
          .toDate(); // today date

      let checkInTimeInHour = parseInt(req.body.checkInTimeInHour); // getting the check in hour
      let checkInTimeInMins = parseInt(req.body.checkInTimeInMins); // getting the check in min

      let timeOfTheDayInMins =
        parseInt(checkInTimeInHour) * 60 + parseInt(checkInTimeInMins); // getting the time in mins

      let attendanceLog = [
        {
          checkInDate: todaysDate,
          checkInTimeInMins: parseInt(timeOfTheDayInMins),
          driverName: driverName,
          createdDate: new Date(),
        },
      ];

      let startOfTheDay = moment()
        .set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0,
        })
        .toDate();

      // getting the end of the day
      let endOfTheDay = moment()
        .set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0,
        })
        .toDate();

      // inserting the new user into the db
      let isInserted = await attendanceModel
        .findOneAndUpdate(
          {
            vehicleId: mongoose.Types.ObjectId(vehicleId),
            dateOfAttendance: {
              $gte: startOfTheDay,
              $lte: endOfTheDay,
            },
          },
          {
            $set: {
              dateOfAttendance: todaysDate,
              status: 1,
              isDeleted: 0,
            },
            $push: {
              attendanceLog: attendanceLog,
            },
          },
          {
            upsert: true,
            new: true,
          }
        )
        .then((data) => {
          if (data) {
            let response = data.toObject();
            let totalWorkingInMins = 0;
            // get the total working in mins
            if (data.attendanceLog && data.attendanceLog.length)
              totalWorkingInMins = _.sumBy(
                data.attendanceLog,
                "totalWorkingInMins"
              );
            return {
              ...response,
              isFirstCheckedIn: data.attendanceLog
                ? data.attendanceLog.length
                  ? 1
                  : 0
                : 0,
              attendanceLog: data.attendanceLog
                ? data.attendanceLog.length
                  ? data.attendanceLog[data.attendanceLog.length - 1]
                  : []
                : [],
              totalWorkingInMinsTillLastCheckOut: totalWorkingInMins || 0,
            };
          } else
            return {
              ...response,
              isFirstCheckedIn: 0,
              attendanceLog: {},
              totalWorkingInMinsTillLastCheckOut: 0,
            };
        });

      // is inserted
      if (isInserted && !_.isEmpty(isInserted)) {
        // success response
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          isInserted,
          this.messageTypes.attendanceMarkedSuccessfully
        );
      } else
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.attendanceNotMarkedSuccessfully
        );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  // get all Vehicle list which are not check in
  getAllVehicleListToCheckIn = async (req, res) => {
    try {
      info("Get the Vehicle List !");

      // get the query params
      let alreadyCheckInVehicleIds = req.body.alreadyCheckInVehicleIds || [],
        page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 60;
        }),
        searchKey = req.query.search || "",
        sortBy = req.query.sortBy || "createdAt",
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // get the list of asm in the allocated city
      let searchObject = {
        isDeleted: 0,
        _id: {
          $nin: alreadyCheckInVehicleIds,
        },
      };

      // creating a match object
      if (searchKey !== "")
        searchObject = {
          ...searchObject,
          $or: [
            {
              regNumber: {
                $regex: searchKey,
                $options: "is",
              },
            },
            {
              vehicleModel: {
                $regex: searchKey,
                $options: "is",
              },
            },
          ],
        };

      // // get the total rate category
      let totalVehicle = await masterModel.countDocuments({
        ...searchObject,
      });

      // get the Vehicle list
      let vehicleList = await masterModel
        .aggregate([
          {
            $match: {
              ...searchObject,
            },
          },
          {
            $sort: sortingArray,
          },
          {
            $skip: skip,
          },
          {
            $limit: pageSize,
          },
          {
            $lookup: {
              from: "ratecategorytransportervehiclemappings",
              let: {
                id: "$_id",
              },
              pipeline: [
                {
                  $match: {
                    // 'status': 1,
                    isDeleted: 0,
                    $expr: {
                      $eq: ["$vehicleId", "$$id"],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    status: 1,
                    isDeleted: 1,
                    vehicleId: 1,
                    transporterId: 1,
                    rateCategoryId: 1,
                  },
                },
                {
                  $lookup: {
                    from: "transporters",
                    localField: "transporterId",
                    foreignField: "_id",
                    as: "transporter",
                  },
                },
                {
                  $unwind: {
                    path: "$transporter",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $lookup: {
                    from: "ratecategorymodels",
                    localField: "rateCategoryId",
                    foreignField: "_id",
                    as: "rateCategory",
                  },
                },
                {
                  $unwind: {
                    path: "$rateCategory",
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
              as: "transporterRateCategoryDetails",
            },
          },
          {
            $unwind: {
              path: "$transporterRateCategoryDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              regNumber: 1,
              vehicleType: 1,
              tonnage: 1,
              status: 1,
              rateCategoryName:
                "$transporterRateCategoryDetails.rateCategory.rateCategoryDetails.rateCategoryName",
              transporterName:
                "$transporterRateCategoryDetails.transporter.vehicleDetails.name",
            },
          },
        ])
        .allowDiskUse(true);
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          results: vehicleList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalVehicle,
          },
        }
        // this.messageTypes.transporterFetched
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  // check out Vehicle
  checkOutVehicle = async (req, res) => {
    try {
      info("Checking Out Vehicle !");

      let vehicleId = req.params.vehicleId, // Vehicle Id
        checkOutDate = moment(req.body.checkOutDate, "DD-MM-YYYY")
          .set({
            h: 0,
            m: 0,
            s: 0,
            millisecond: 0,
          })
          .toDate();
      // let user = req.user, // user
      //   todaysDate = new Date(); // todays date

      let checkOutTimeInHour = parseInt(req.body.checkOutTimeInHour); // getting the check out hour
      let checkOutTimeInMins = parseInt(req.body.checkOutTimeInMins); // getting the check out min

      // let todayTimeInHour = moment().format('HH'); // getting the current hour
      // let todayTimeInMins = moment().format('mm'); // getting the current min
      let timeOfTheDayInMins =
        parseInt(checkOutTimeInHour) * 60 + parseInt(checkOutTimeInMins); // getting the time in mins

      // inserting the new user into the db
      let updateObj = {
        "attendanceLog.$[attendanceLog].checkOutDate": checkOutDate,
        "attendanceLog.$[attendanceLog].checkOutTimeInMins":
          parseInt(timeOfTheDayInMins),
        "attendanceLog.$[attendanceLog].isCheckedOut": 1,
        "attendanceLog.$[attendanceLog].totalWorkingInMins":
          parseInt(timeOfTheDayInMins) - parseInt(req.body.checkInTimeInMins),
      };

      // update the data
      let isUpdated = await attendanceModel.update(
        {
          _id: req.body.attendanceId,
          vehicleId: vehicleId,
        },
        {
          $set: {
            ...updateObj,
          },
        },
        {
          arrayFilters: [
            {
              "attendanceLog._id": mongoose.Types.ObjectId(
                req.body.attendanceLogId
              ),
            },
          ],
        }
      );

      // is inserted
      if (isUpdated && !_.isEmpty(isUpdated)) {
        // inserting the new user into the db
        let dataToSend = await attendanceModel
          .findOne({
            _id: req.body.attendanceId,
          })
          .then((data) => {
            if (data) {
              let response = data.toObject();
              let totalWorkingInMins = 0;
              // get the total working in mins
              if (data.attendanceLog && data.attendanceLog.length)
                totalWorkingInMins = _.sumBy(
                  data.attendanceLog,
                  "totalWorkingInMins"
                );
              return {
                ...response,
                isFirstCheckedIn: data.attendanceLog
                  ? data.attendanceLog.length
                    ? 1
                    : 0
                  : 0,
                attendanceLog: data.attendanceLog
                  ? data.attendanceLog.length
                    ? data.attendanceLog[data.attendanceLog.length - 1]
                    : []
                  : [],
                totalWorkingInMinsTillLastCheckOut: totalWorkingInMins || 0,
              };
            } else
              return {
                ...response,
                isFirstCheckedIn: 0,
                attendanceLog: {},
                totalWorkingInMinsTillLastCheckOut: 0,
              };
          });

        // success response
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          dataToSend,
          this.messageTypes.vehicleCheckedOut
        );
      } else
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.vehicleCheckedNotOut
        );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };
  
  // get all Vehicle list which are checked in
  checkedInVehicles = async (req, res) => {
    try {
      info("Get all the Waiting Vehicle List !");

      // get the query params
      let alreadyCheckInVehicleIds = req.body.alreadyCheckInVehicleIds || [],
        page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 60;
        }),
        searchKey = req.query.search || "",
        sortBy = req.query.sortBy || "createdAt",
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      let startOfTheDay = moment()
        .set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0,
        })
        .toDate();

      // getting the end of the day
      let endOfTheDay = moment()
        .set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0,
        })
        .toDate();

      // get the list of asm in the allocated city
      let searchObject = {
        isDeleted: 0,
        _id: {
          $in: alreadyCheckInVehicleIds,
        },
      };

      // creating a match object
      if (searchKey !== "")
        searchObject = {
          ...searchObject,
          $or: [
            {
              regNumber: {
                $regex: searchKey,
                $options: "is",
              },
            },
            {
              vehicleModel: {
                $regex: searchKey,
                $options: "is",
              },
            },
          ],
        };

      // // get the total rate category
      let totalVehicle = await masterModel.countDocuments({
        ...searchObject,
      });

      // get the Vehicle list
      let vehicleList = await masterModel.aggregate([
        {
          $match: {
            ...searchObject,
          },
        },
        {
          $sort: sortingArray,
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
        {
          $lookup: {
            from: "ratecategorytransportervehiclemappings",
            let: {
              id: "$_id",
            },
            pipeline: [
              {
                $match: {
                  // 'status': 1,
                  isDeleted: 0,
                  $expr: {
                    $eq: ["$vehicleId", "$$id"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  status: 1,
                  isDeleted: 1,
                  vehicleId: 1,
                  transporterId: 1,
                  rateCategoryId: 1,
                },
              },
              {
                $lookup: {
                  from: "transporters",
                  localField: "transporterId",
                  foreignField: "_id",
                  as: "transporter",
                },
              },
              {
                $unwind: {
                  path: "$transporter",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: "ratecategorymodels",
                  localField: "rateCategoryId",
                  foreignField: "_id",
                  as: "rateCategory",
                },
              },
              {
                $unwind: {
                  path: "$rateCategory",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: "transporterRateCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$transporterRateCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "vehicleattendances",
            let: {
              id: "$_id",
            },
            pipeline: [
              {
                $match: {
                  // 'status': 1,
                  isDeleted: 0,
                  $expr: {
                    $eq: ["$vehicleId", "$$id"],
                  },
                  dateOfAttendance: {
                    $gte: startOfTheDay,
                    $lte: endOfTheDay,
                  },
                },
              },
              {
                $project: {
                  //  '_id': 0,
                  attendanceLog: 1,
                  vehicleId: 1,
                  dateOfAttendance: {
                    $dateToString: {
                      format: "%m-%d-%Y",
                      date: "$dateOfAttendance",
                      timezone: "+05:30",
                    },
                  },
                },
              },

              { $unwind: "$attendanceLog" },
              { $sort: { "attendanceLog.checkInDate": 1 } },
              {
                $group: {
                  _id: "$_id",
                  attendanceLog: { $push: "$attendanceLog" },
                },
              },
              //   { $project: { 'attendanceLog': '$attendanceLog' } },
            ],
            as: "attendanceDetails",
          },
        },
        {
          $unwind: {
            path: "$attendanceDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // { $unwind: '$attendanceDetails.attendanceLog' },
        // { $sort: { 'attendanceDetails.attendanceLog.checkInDate': 1 } },
        // { $group: { _id: '$attendanceDetails._id', 'attendanceLog': { $push: '$attendanceDetails.attendanceLog' } } },
        // // { $project: { 'attendanceDetails.attendanceLog': '$attendanceLog' } },

        {
          $project: {
            _id: 1,
            regNumber: 1,
            vehicleType: 1,
            vehicleModel: 1,
            tonnage: 1,
            status: 1,
            'rateCategoryName': '$transporterRateCategoryDetails.rateCategory.rateCategoryDetails.rateCategoryName',
            // rateCategoryDetails: "$transporterRateCategoryDetails.rateCategory",
            // attendanceDetails: 1,
            'attendanceLog': '$attendanceDetails.attendanceLog',
            // transporterId: "$transporterRateCategoryDetails.transporter._id",
            transporterName:
              "$transporterRateCategoryDetails.transporter.vehicleDetails.name",
          },
        },
      ]).allowDiskUse(true);

      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          results: vehicleList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalVehicle,
          },
        }
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };
}

module.exports = new vehicleInfoController();
