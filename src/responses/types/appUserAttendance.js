module.exports = {
  attendanceMarkedSuccessfully: "User Checked In !",
  attendanceNotMarkedSuccessfully:
    "Attendance Not Marked Successfully, Please try again after sometime !",
  invalidPickerBoyId: "Invalid PickerBoy Id !",
  invalidSecurityGuardId: "Invalid Security Guard Id !",
  pickerBoyNotCheckedIn: "User Still Not Checked In !",

  salesmanNotCheckedIn: "User Still Not Checked In !",
  invalidSalesmanId: "Invalid Salesman Id !",
  userCheckedOut: "User Checked Out Successfully !",
  userCheckedNotOut: "Server Error! Please try after sometime !",
  userAlreadyCheckedOut: "User Already Checked Out for today!",
  securityGuardUserCheckedOut: "User Checked Out Please Check In!",
  userAlreadyCheckedIn: "User Already Checked In for today!",
  userAttendanceFetchedSuccessfully: "User Attendance Fetched Successfully !",
  userAttendanceFetchError:
    "Unable to fetch attendance, Please try again after sometime !",
  deliveryExecutiveNotCheckedIn: "User Still Not Checked In !",
  invalidDeliveryExecutiveId: "Invalid Delivery Executive Id !",

  userAlreadyCheckedInAt: (timeString) => {
    return `User Already Checked-In at ${timeString}`;
  },
  checkInNotAllowedAfterFreezeTime: (freezeTime) => {
    return `Check In not allowed after ${freezeTime}`;
  },
  userAlreadyCheckedOutAt: (timeString) => {
    return `User Already Checked-Out at ${timeString}`;
  },
};
