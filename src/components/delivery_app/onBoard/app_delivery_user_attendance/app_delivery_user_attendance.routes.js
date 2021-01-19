// user controller
const ctrl = require("./app_delivery_user_attendance.controller");

// custom joi validation
const {
  joiUserAttendanceMonth, // joi fetch user attendance per month
} = require('./app_delivery_user_attendance.validators');

// custom hooks
const {
  isDeliveryExecutiveCheckedIn, // is user checked in
  isValidDeliveryId, // check whether the salesman id is valid or not
  isDeliveryAlreadyCheckedIn, // check whether the user already check In
  getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out
  deliveryGenerateMonthDaysAndOtherMetaData, // generate month days and other meta data
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
      isDeliveryAlreadyCheckedIn, // check whether the user is already checked in
      ctrl.checkInUser // controller function
    );

    // mark checkout attendance
    closed.route("/user/attendance/check-out").get(
        verifyDeliveryAppToken, // verify app token
        isValidDeliveryId, // validate salesman Id
        isDeliveryExecutiveCheckedIn, // check whether the user is already checked in
      ctrl.checkOutUser // controller function
    );

    //  get user attendance per month
    closed.route('/user/attendance/month/:month/year/:year').get(
         [joiUserAttendanceMonth], // joi validation for user attendance 
         verifyDeliveryAppToken, // verify app token
         isValidDeliveryId, // validate salesman Id
         deliveryGenerateMonthDaysAndOtherMetaData, // generate month days and other metadata
        ctrl.getUserAttendanceForAMonth, // controller function
      )
  
  
      // get auto checkout 
      open.route('/user/attendance/auto/check-out').get(
       // getAllAppUserWhoAreNotCheckedOut, // get all app users who are not checked out of the app
        ctrl.autoCheckout, // controller function
      )

  };
}

module.exports = userDeliveryExecutiveRoutes();
