module.exports = {
  getCustomerDetails: require('./getCustomerDetails'), // get the customer details using the city id and customer Id 
  getAgencyListForDeliveryAnPickerBoy: require('./getAgencyListForDeliveryAnPickerBoy'), // get the agency list for delivery and pickerboy
  checkWhetherAgencyNameAlreadyExist: require('./checkWhetherAgencyNameAlreadyExist'), // check whether the agency name already exist or not in dms v1
  createNewAgencyForPickerAndDeliveryExecutive: require('./createNewAgencyForPickerAndDeliveryExecutive'), //create a new agency for the delivery and pickerboy
}