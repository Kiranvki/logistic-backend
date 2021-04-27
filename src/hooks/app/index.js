module.exports = {
  // On boarding hooks 
  checkWhetherAValidPickerCrediantial: require('./checkWhetherAValidPickerCrediantial'),
  checkWhetherAValidSecurityGuardCrediantial: require('./checkWhetherAValidSecurityGuardCrediantial'),
  generateOtp: require('./generateOtp'),
  sendTheOtpToTheDevice: require('./sendTheOtpToTheDevice'),
  isValidPickerBoyId: require('./isValidPickerBoyId'),
  checkOtpIsValidOrNot: require('./checkOtpIsValidOrNot'),
  generateTokenForAppUsers: require('./generateTokenForAppUsers'),
  isAlreadyCheckedIn: require('./isAlreadyCheckedIn'),
  isUserCheckedIn: require('./isUserCheckedIn'),
  generateMonthDaysAndOtherMetaData: require('./generateMonthDaysAndOtherMetaData'),
  deliveryGenerateMonthDaysAndOtherMetaData: require('./deliveryGenerateMonthDaysAndOtherMetaData'),
  securityGenerateMonthDaysAndOtherMetaData :require('./securityGenerateMonthDaysAndOtherMetaData'),
  getAllAppUserWhoAreNotCheckedOut: require('./getAllAppUserWhoAreNotCheckedOut'),
  isValidPickerBoy: require('./isValidPickerBoy'),
  isValidSalesOrder: require('./isValidSalesOrder'),
  isItemAlreadyAdded: require('./isItemAlreadyAdded'),
  isValidItemQuantity: require('./isValidItemQuantity'),
  isInvoiceGenerated: require('./isInvoiceGenerated'), //check whether the invoice is already generated
  isAlreadyAddedInPickingState: require('./isAlreadyAddedInPickingState'), // check whether the salesOrderId is already added into the picker state
  checkWhetherItsAValidItemUpdate: require('./checkWhetherItsAValidItemUpdate'), // check whether the valid item update
  checkWhetherItsAValidPickerUpdate: require('./checkWhetherItsAValidPickerUpdate'),  // check whether its a valid update
  isValidSecurityGuardId: require('./isValidSecurityGuardId'),
  generateTokenForSecurityAppUsers: require('./generateTokenForSecurityAppUsers'),
  generateTokenForDeliveryAppUsers: require('./generateTokenForDeliveryAppUsers'),
  isSecurityGuardAlreadyCheckedIn: require('./isSecurityGuardAlreadyCheckedIn'), // check whether the security guard already check in or not
  isSecurityGuardUserCheckedIn: require('./isSecurityGuardUserCheckedIn'),
  isValidDeliveryId : require('./isValidDeliveryExecutiveId'),
  checkWhetherAValidDeliveryExecutiveCrediantial : require('./checkWhetherAValidDeliveryExecutiveCrediantial'), // check whether the delivery executive already check in or not
  isDeliveryExecutiveCheckedIn :require('./isDeliveryExecutiveUserCheckedIn'),
  checkWhetherItsAValidDeliveryUpdate: require('./checkWhetherItsAValidDeliveryUpdate'),
  checkWhetherItsAValidSecurityUpdate: require('./checkWhetherItsAValidSecurityUpdate'),
  isDeliveryAlreadyCheckedIn: require('./isDeliveryAlreadyCheckedIn'),
  getOrderItemDetail: require('./getOrderItemDetail'),
  validateOrderItemQuantity: require('./validateOrderItemQuantity'),
  checkFullfilmentStatus: require('./checkFullfilmentStatus'),
  checkIsInPickingState: require('./checkIsInPickingState'),
  isValidPoId: require('./isValidPoId'),
  poReceivingInitiationValidations:require('./poReceivingInitiationValidations'),
  isValidPOReceivingId:require('./isValidPOReceivingId'),
  isValidPogrnId:require('./isValidPogrnId'),
  isValidPORecIdForGrnGetDetails:require('./isValidPORecIdForGrnGetDetails'),
  grnAlreadyGenerated:require('./grnAlreadyGenerated'),
  getPickedItemDetail:require('./getPickedItemDetail'),
  hasOrderAlreadyInReceivingState:require('./hasOrderAlreadyInReceivingState'),
  isValidInputsForReceivedItem:require('./isValidInputsForReceivedItem'),
  generateDelivery:require('./generateDelivery'),
  updateSapDeliveryDetail:require('./updateSapDeliveryDetail'),
  generateInvoice:require('./generateInvoice'),
  updateInvoiceSAPDataToDB:require('./updateInvoiceSAPDataToDB'),
  fetchInvoice:require('./fetchInvoice'),
  getPOFulfilmentStatusAndCheckUpcomingDeliveryDate:require('./getPOFulfilmentStatusAndCheckUpcomingDeliveryDate'),
  getPODetails:require('./getPODetails'),
  storeGRNDetailsIntoDB:require('./storeGRNDetailsIntoDB'),
  generateGRN:require('./generateGRN'),
  getDeliveryNumber:require('./getDeliveryNumber')

}
