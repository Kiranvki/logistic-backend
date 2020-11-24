// user controller 
const ctrl = require('./app_picker_user_attendance.controller');

// custom joi validation
const {
  joiUserAttendanceMonth, // joi fetch user attendance per month
} = require('./app_picker_user_attendance.validators');

// custom hooks 
const {
  isUserCheckedIn, // is user checked in 
  isValidPickerBoyId, // check whether the salesman id is valid or not
  isAlreadyCheckedIn, // check whether the user already check In
  getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out
  generateMonthDaysAndOtherMetaData, // generate month days and other meta data 
} = require('../../../../hooks/app')

// auth 
const {
  verifyAppToken
} = require('../../../../hooks/app/Auth');

// exporting the user routes 
function userRoutes() {
  return (open, closed, appOpen, appClosed) => {

    // mark attendance
    closed.route('/user/attendance/check-in').get(
      verifyAppToken, // verify app token
      isValidPickerBoyId, // validate salesman Id
      isAlreadyCheckedIn, // check whether the user is already checked in 
      ctrl.checkInUser, // controller function
    )

    // mark checkout attendance 
    closed.route('/user/attendance/check-out').get(
      verifyAppToken, // verify app token
      isValidPickerBoyId, // validate salesman Id
      isUserCheckedIn, // check whether the user is already checked in 
      ctrl.checkOutUser, // controller function
    )

    //  get user attendance per month
    closed.route('/user/attendance/month/:month/year/:year').get(
      [joiUserAttendanceMonth], // joi validation for user attendance 
      verifyAppToken, // verify app token
      isValidPickerBoyId, // validate salesman Id
      generateMonthDaysAndOtherMetaData, // generate month days and other metadata
      ctrl.getUserAttendanceForAMonth, // controller function
    )

    /*
      // get auto checkout 
      open.route('/user/attendance/auto/check-out').get(
        getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out of the app
        ctrl.autoCheckout, // controller function
      )
*/
  };
}

module.exports = userRoutes();
