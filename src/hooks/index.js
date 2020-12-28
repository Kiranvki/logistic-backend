const isValidTransporter = require('./isValidTransporterId');

module.exports = {
  // On boarding hooks 
  getDetailsFromZoho: require('./getDetailsFromZoho'),// get the details from zoho  
  getTheDetailsFromGoFrugal: require('./getTheDetailsFromGoFrugal'), // // get the details from go frugal 
  setupDataForGoFrugalApi: require('./setupDataForGoFrugalApi'),// setup the api for gofrugal  
  isValidPickerBoyId: require('./app/isValidPickerBoyId'),  //check whether the picker id is correct or not
  generateOtp: require('./app/generateOtp'), // generate the OTP
  isValidAgencyId: require('./isValidAgencyId'),//check whether the agencyId is valid or not
  isValidTransporter: require('./isValidTransporterId'),
  checkWhetherItsAValidTransporterUpdate: require('./checkWhetherItsAValidTransporterUpdate'),
  checkWhetherItsAValidVehicleUpdate: require('./checkWhetherItsAValidVehicleUpdate'), //hook to check Whether Its A Valid Vehicle Update or not
  isValidVehicle: require('./isValidVehicle'), // check whether the Valid Vehicle id
  checkWhetherItsAValidRateCategoryUpdate: require('./checkWhetherItsAValidRateCategoryUpdate'), // checkWhetherItsAValidRateCategoryUpdate
}