// user controller 
const ctrl = require('./vehicle_attendance.controller');

// custom joi validation
const {
  joiUserAttendanceMonth, // joi fetch user attendance per month
} = require('./vehicle_attendance.validators');

// custom hooks 
const {
  isVehicleCheckedIn, // is vehicle checked in
  // isValidPickerBoyId, // check whether the salesman id is valid or not
  isAlreadyCheckedIn, // check whether the vehicle already check In
  // getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out
  generateMonthDaysAndOtherMetaData, // generate month days and other meta data 
} = require('../../../hooks')

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');

// exporting the user routes 
function userRoutes() {
  return (open, closed, appOpen, appClosed) => {

    // mark attendance
    closed.route('/attendance/check-in/:vehicleId').post(
      // verifyUserToken, // verify user token
      isAlreadyCheckedIn, // check whether the vehicle is already checked in 
      ctrl.checkInVehicle, // controller function
    )

    // mark checkout attendance 
    closed.route('/attendance/check-out/:vehicleId').post(
      //  verifyAppToken, // verify user token
      //   isValidPickerBoyId, // validate salesman Id
      isVehicleCheckedIn, // check whether the vehicle is already checked in 
      ctrl.checkOutVehicle, // controller function
    )

    //  get vehicle attendance per month
    closed.route('/attendance/month/:month/year/:year/:vehicleId').get(
      [joiUserAttendanceMonth], // joi validation for user attendance 
      //  verifyAppToken, // verify app token
      //  isValidPickerBoyId, // validate salesman Id
      generateMonthDaysAndOtherMetaData, // generate month days and other metadata
      ctrl.getVehicleAttendanceForAMonth, // controller function
    )

    // get auto checkout 
    open.route('/vehicle/attendance/auto/check-out').get(
      //  getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out of the app
      ctrl.autoCheckout, // controller function
    )

  };
}

module.exports = userRoutes();
