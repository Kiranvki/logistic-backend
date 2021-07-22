// user controller 
const ctrl = require('./app_delivery_user_session.controller');

// custom joi validation
const {
    joiLoginVerify, // joi verify login
    joiOtpLogInValidate, // joi otp validation
  } = require('./app_delivery_user_session.validators');
  
  // custom hooks 
  const {
    generateOtp, // generate OTP 
    isValidDeliveryId, // check whether the salesman id is valid or not 
    checkOtpIsValidOrNot, // check whether the otp is valid or not
    sendTheOtpToTheDevice, // send the otp to the device either via email or sms 
    generateTokenForDeliveryAppUsers, // generate token for app users 
    //checkWhetherAValidPickerCred, // check whether the salesman is valid or not 
    checkWhetherAValidDeliveryExecutiveCrediantial // check whether the salesman is valid or not 
  } = require('../../../../hooks/app');
  
  // auth 
  const {
  } = require('../../../../hooks/app/Auth');

// exporting the user routes 
function deliveryRoutes() {
 return (open, closed) => {
    // login 
    open.route('/user/login-request/:type/otp').post(
      [joiOtpLogInValidate], // joi validation
      checkWhetherAValidDeliveryExecutiveCrediantial, // check for valid picker cred
      generateOtp, // generate OTP
      sendTheOtpToTheDevice, // send OTP to the user device
      ctrl.loginRequest // controller function 
    );

    // forget password
    open.route('/user/:deliveryExecutiveId/login-verify/otp').post(
      [joiLoginVerify], // joi validation
      isValidDeliveryId, // check whether the picker id is valid or not
      checkOtpIsValidOrNot, // check whether the OTP is valid or not
      generateTokenForDeliveryAppUsers, // generate JWT token for app users
      ctrl.loginVerify // controller function
    );
  };
}

module.exports = deliveryRoutes();