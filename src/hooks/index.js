const isValidTransporter = require('./isValidTransporterId');

module.exports = {
  // On boarding hooks 
  getDetailsFromZoho: require('./getDetailsFromZoho'),// get the details from zoho  
  getTheDetailsFromGoFrugal: require('./getTheDetailsFromGoFrugal'), // // get the details from go frugal 
  setupDataForGoFrugalApi: require('./setupDataForGoFrugalApi'),// setup the api for gofrugal  
  isValidPickerBoyId: require('./app/isValidPickerBoyId'),  //check whether the picker id is correct or not
  generateOtp: require('./app/generateOtp'), // generate the OTP
  isValidAgencyId: require('./isValidAgencyId'),//check whether the agencyId is valid or not
  isValidEmployee : require('./isValidEmployeeId'),
  isValidTransporter: require('./isValidTransporterId'),
  checkWhetherItsAValidTransporterUpdate: require('./checkWhetherItsAValidTransporterUpdate'),
  checkWhetherItsAValidVehicleUpdate: require('./checkWhetherItsAValidVehicleUpdate'), //hook to check Whether Its A Valid Vehicle Update or not
  isValidVehicle: require('./isValidVehicle'), // check whether the Valid Vehicle id
  checkWhetherItsAValidRateCategoryUpdate: require('./checkWhetherItsAValidRateCategoryUpdate'), // checkWhetherItsAValidRateCategoryUpdate
  isValidRateCategory: require('./isValidRateCategory'),// check whether the RateCategory id valid or not
  isAlreadyCheckedIn: require('./isAlreadyCheckedIn'), // check whether the vehicle already check In
  isVehicleCheckedIn: require('./isVehicleCheckedIn'), // is vehicle checked in
  generateMonthDaysAndOtherMetaData: require('./generateMonthDaysAndOtherMetaData'),// generate month days and other meta data 
  getAllCheckInVehicleDetails: require('./getAllCheckInVehicleDetails'), // get all the check in vehicle details
  getDetailsFromZoho: require('./getDetailsFromZoho'),
  isAgencyExists: require('./isAgencyExists'), // check whether the agency exists or not 
  getDetailsFromZohoUsingEmpID: require('./getDetailsFromZohoUsingEmpID'), // get the details from zoho  
  checkWhetherItsAValidEmployeeUpdate: require('./checkWhetherItsAValidEmployeeUpdate'), //check whether its A Valid Employee Update
}