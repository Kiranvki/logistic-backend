// user controller 
const ctrl = require('./app_security_guard_user_session.controller');

// custom joi validation
const {
  joiLoginVerify, // joi verify login
  joiOtpLogInValidate, // joi otp validation
} = require('./app_security_guard_user_session.validators');

// custom hooks 
const {
  generateOtp, // generate OTP 
  isValidSecurityGuardId, // check whether the security guard id is valid or not 
  checkOtpIsValidOrNot, // check whether the otp is valid or not
  sendTheOtpToTheDevice, // send the otp to the device either via email or sms 
  generateTokenForSecurityAppUsers, // generate token for security app users 
  //checkWhetherAValidPickerCred, // check whether the salesman is valid or not 
  checkWhetherAValidSecurityGuardCrediantial // check whether the security guard is valid or not 
} = require('../../../../hooks/app');

// auth 
const {
} = require('../../../../hooks/app/Auth');

// exporting the user routes 
function userRoutes() {
  return (open, closed) => {
    // login 
    open.route('/user/login-request/:type/otp').post(
      [joiOtpLogInValidate], // joi validation
      checkWhetherAValidSecurityGuardCrediantial, // check for valid security guard cred
      generateOtp, // generate OTP
      sendTheOtpToTheDevice, // send OTP to the user device
      ctrl.loginRequest // controller function 
    );

    // verify otp
    open.route('/user/:securityGuardId/login-verify/otp').post(
      [joiLoginVerify], // joi validation
      isValidSecurityGuardId, // check whether the security guard id is valid or not
      checkOtpIsValidOrNot, // check whether the OTP is valid or not
      generateTokenForSecurityAppUsers, // generate JWT token for app users
      ctrl.loginVerify // controller function
    );
  };
}

module.exports = userRoutes();
