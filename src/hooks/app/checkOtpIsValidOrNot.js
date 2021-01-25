// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const moment = require('moment');
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the salesman exist or not !');

    let otp = req.body.otp, // user otp 
      userSession = req.body.userSession, // user session 
      //  salesmanDetails = req.body.isValidPickerBoy, // salesman details 
      todaysDate = moment();

    // get otp stored 
    let validOtpStored = userSession.otpSend.filter((data) => {
      var expiryDate = moment(data.createdAt)
        .add(data.expiryInMin, 'minutes')
      let diff = todaysDate.diff(expiryDate, 'mins');
      return (diff < 0 && data.status == 1);
    });

    // get the otps 
    let validOtp = validOtpStored.map((data) => data.otp);

    // check whether the otp is valid or not 
    if (validOtp.indexOf(otp.toString()) >= 0) {
      info('OTP IS VALID !');
      return next();
    } else {
      error('INVALID OTP !');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserOnBoard.invalidOtp);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
