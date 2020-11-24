module.exports = {
  // On boarding hooks 
  checkWhetherAValidPickerCrediantial: require('./checkWhetherAValidPickerCrediantial'),
  generateOtp: require('./generateOtp'),
  sendTheOtpToTheDevice: require('./sendTheOtpToTheDevice'),
  isValidPickerBoyId: require('./isValidPickerBoyId'),
  checkOtpIsValidOrNot: require('./checkOtpIsValidOrNot'),
  generateTokenForAppUsers: require('./generateTokenForAppUsers'),
  isAlreadyCheckedIn: require('./isAlreadyCheckedIn'),
  isUserCheckedIn: require('./isUserCheckedIn'),
  generateMonthDaysAndOtherMetaData: require('./generateMonthDaysAndOtherMetaData'),
  getAllAppUserWhoAreNotCheckedOut: require('./getAllAppUserWhoAreNotCheckedOut'),
  isValidPickerBoy: require('./isValidPickerBoy')
}