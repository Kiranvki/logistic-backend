// user controller
const ctrl = require("./app_delivery_user_attendance.controller");

// custom joi validation
const {
  joiUserAttendanceMonth, // joi fetch user attendance per month
} = require('./app_delivery_user_attendance.controller');

// custom hooks
const {
  isDeliveryExecutiveCheckedIn, // is user checked in
  isValidDeliveryId, // check whether the salesman id is valid or not
  isAlreadyCheckedIn, // check whether the user already check In
  getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out
  generateMonthDaysAndOtherMetaData, // generate month days and other meta data
} = require("../../../../hooks/app");

// auth
const { verifyDeliveryAppToken } = require("../../../../hooks/app/Auth");

// exporting the user routes
function userDeliveryExecutiveRoutes() {
  return (open, closed, appOpen, appClosed) => {
    // mark attendance
    closed.route("/user/attendance/check-in").get(
      verifyDeliveryAppToken, // verify app token
      isValidDeliveryId, // validate salesman Id
      isAlreadyCheckedIn, // check whether the user is already checked in
      ctrl.checkInUser // controller function
    );

    // mark checkout attendance
    closed.route("/user/attendance/check-out").get(
        verifyDeliveryAppToken, // verify app token
        isValidDeliveryId, // validate salesman Id
        isDeliveryExecutiveCheckedIn, // check whether the user is already checked in
      ctrl.checkOutUser // controller function
    );
  };
}

module.exports = userDeliveryExecutiveRoutes();
