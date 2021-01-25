module.exports = {
  invalidUserCred: (type) => {
    return `${type} still not registered !`;
  },
  invalidOtpServer: (error) => {
    return `Error : ${error} !`;
  },
  unableToSendEmailOtp: 'Unable to send Email OTP at this moment !',
  otpRegeneratedSuccessfully: 'Otp Send Successfully!',
  unableToGenerateOtpRightNow: 'Unable to generate OTP!',
  userLoginRequestStillNotRegenerated: 'User Still not requested for Login OTP!',
  invalidOtp: 'OTP entered is not valid or expired !',
  userLoggedInSuccessfully: 'User Logged In Successfully !',
  unableToVerifyOtp: 'Unable to verfiy OTP right now, Please try again after sometime !',
  userCreatedSuccessfully : 'User Created Successfully !',
  userNotCreated : "User Not Created Successfully !"
}