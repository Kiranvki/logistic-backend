module.exports = {
  attendanceMarkedSuccessfully: 'Vehicle Checked In !',
  attendanceNotMarkedSuccessfully: 'Attendance Not Marked Successfully, Please try again after sometime !',
  vehicleNotCheckedIn: 'Vehicle Still Not Checked In !',
  invalidVehicleId: 'Invalid Vehicle Id !',
  vehicleCheckedOut: 'Vehicle Checked Out Successfully !',
  vehicleCheckedNotOut: 'Server Error! Please try after sometime !',
  vehicleAlreadyCheckedOut: 'Vehicle Already Checked Out for today!',
  vehicleAlreadyCheckedIn: 'Vehicle Already Checked In for today!',
  vehicleAttendanceFetchedSuccessfully: 'Vehicle Attendance Fetched Successfully !',
  vehicleAttendanceFetchError: 'Unable to fetch attendance, Please try again after sometime !',
  vehicleAlreadyCheckedInAt: (timeString) => {
    return `Vehicle Already Checked-In at ${timeString}`;
  },
  checkInNotAllowedAfterFreezeTime: (freezeTime) => {
    return `Check In not allowed after ${freezeTime}`;
  },
  vehicleAlreadyCheckedOutAt: (timeString) => {
    return `Vehicle Already Checked-Out at ${timeString}`;
  },
}