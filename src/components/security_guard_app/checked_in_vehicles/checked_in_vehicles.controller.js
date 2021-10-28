const BaseController = require("../../baseController");
// const Model = require("./models/checked_in_vehicles.model");
const Model = require("../../vehicle/vehicle_attendance/models/vehicle_attendance.model");

class vehicleInfoController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.vehicle;
  }

  // to fetch only the checked in vehicles from all the vehicles
  checkedInVehicles = async (req, res) => {
    try {
      console.log("date>>>>>>", new Date());
      info("Get Vechicle List !");
      return Model.find({ "attendanceLog.isCheckedOut": 0 })
        .then((res) => {
          if (res && res.length) {
            return {
              success: true,
              data: res[res.length - 1],
            };
          } else {
            error("Error Searching Checked In Vehicles!");
            return {
              success: false,
            };
          }
        })
        .catch((err) => {
          error(err);
          return {
            success: false,
            error: err,
          };
        });

      // catch any runtime error
    } catch (err) {
      return {
        success: false,
        error: err,
      };
    }
  };

  //to fetch details of one checked in vehicle
  checkedInVehicle = async (req, res) => {
    try {
      info("Get one checked-in vehicle !");
      return Model.find({
        vehicleNo: req.body.vehicleNo,
        isCheckedIn: true,
        isDeleted: 0,
      })
        .lean()
        .then((res) => {
          if (res && res.length) {
            return {
              success: true,
              data: res,
            };
          } else {
            error("Error Searching Checked In Vehicles!");
            return {
              success: false,
            };
          }
        })
        .catch((err) => {
          console.log(err);
          return {
            success: false,
            error: err,
          };
        });

      // catch any runtime error
    } catch (err) {
      return {
        success: false,
        error: err,
      };
    }
  };

  // to fetch details of a vehicle
  vehicledetails = async (req, res) => {
    try {
      info("Get Details Of A Vehicle !");
      return Model.find({ vehicleNo: req.body.vehicleNo, isDeleted: 0 })
        .lean()
        .then((res) => {
          if (res && res.length) {
            return {
              success: true,
              data: res,
            };
          } else {
            error("No vehicle found!");
            return {
              success: false,
            };
          }
        })
        .catch((err) => {
          console.log(err);
          return {
            success: false,
            error: err,
          };
        });

      // catch any runtime error
    } catch (err) {
      return {
        success: false,
        error: err,
      };
    }
  };

  // Fetching the vehicle details and update the check in time for checking in the vehicle
  vehicleCheckIn = async (req, res) => {
    try {
      info("Updating Check-in time !");
      return Model.findOneAndUpdate(
        { vehicleNo: req.body.vehicleNo },
        { checkInTime: req.body.checkInTime },
        {
          upsert: false,
          new: true,
        }
      )
        .then((result) => {
          if (result) {
            return {
              success: true,
              data: result,
            };
          } else {
            error("No vehicle found!");
            return {
              success: false,
            };
          }
        })
        .catch((err) => {
          error(err);
          return {
            success: false,
            error: err,
          };
        });

      // catch any runtime error
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
}

module.exports = new vehicleInfoController();
