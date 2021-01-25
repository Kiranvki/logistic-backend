// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const BasicCtrl = require('../../components/basic_config/basic_config.controller');
const {
  error,
  info
} = require('../../utils').logging;
const generateOTP = () => {
  let digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Hashing the password field in the request!');

    // getting the total salt rounds
    const expiryTimeForAppToken = await BasicCtrl.GET_OTP_EXPIRY_TIME_IN_MIN().then((res) => { if (res.success) return res.data; else return 10; });

    // get random digits
    let rand = generateOTP();

    // creating otp object 
    let otpObject = {
      otp: parseInt(process.env.sendSms) == 1 ? rand : 1234,
      expiryTimeForAppToken: expiryTimeForAppToken
    };

    // injecting into request body
    req.body.otpObject = otpObject;

    // move on
    return next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
