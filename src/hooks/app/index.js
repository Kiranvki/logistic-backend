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
  isValidPickerBoy: require('./isValidPickerBoy'),
  isValidSalesOrder: require('./isValidSalesOrder'),
  isItemAlreadyAdded: require('./isItemAlreadyAdded'),
  isInvoiceGenerated: require('./isInvoiceGenerated'), //check whether the invoice is already generated
  isAlreadyAddedInPickingState: require('./isAlreadyAddedInPickingState'), // check whether the salesOrderId is already added into the picker state
  checkWhetherItsAValidItemUpdate: require('./checkWhetherItsAValidItemUpdate'), // check whether the valid item update
}
