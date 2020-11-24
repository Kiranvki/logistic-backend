// Controller
const request = require('../../utils/request');

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (mobileNumber, otpTemplate, otp, expiryTime) => {
  try {
    info(`Sending OTP WITH EXPIRY TIME OF ${expiryTime} MINS`);

    // getting the otp 
    let baseUrl = process.env.otpUrl,
      authkey = process.env.authkey,
      otpType = process.env.otpType,
      otpBalUrl = process.env.otpBalUrl;

    // check otp balance
    otpBalUrl = `${otpBalUrl}?authkey=${authkey}&type=${otpType}`;

    // fetching the otp balance
    let fetchOtpBal = await request.get(otpBalUrl)
      .timeout({
        response: 99999, // Wait mins for the server to start sending,
        deadline: 99999, // but allow  minute for the file to finish loading.
      })
      .retry(1)
      .then((res) => {
        return { success: true, data: !isNaN(res.text) ? parseInt(res.text) : 0 };
        // catch any runtime error
      }, (err) => {
        error(err);
        if (err.timeout) {
          return {
            success: false,
            error: 'API timeout'
          };
        } else {
          return {
            success: false,
            error: err
          };
        }
      });

    // getting the otp balance
    if (fetchOtpBal.success && fetchOtpBal.data > 0) {
      // extra params 
      let extraParams = {
        "COMPANY_NAME": "Waycool DMS App",
        "OTP_EXPIRY": expiryTime,
        "OTP": otp
      }

      // generating the otp url
      baseUrl = `${baseUrl}?authkey=${authkey}&template_id=${otpTemplate}&mobile=+91${parseInt(mobileNumber)}&invisible=1&extra_param=${JSON.stringify(extraParams)}`;

      // sending OTP to the given mobile number 
      return request.get(baseUrl)
        .timeout({
          response: 99999, // Wait mins for the server to start sending,
          deadline: 99999, // but allow  minute for the file to finish loading.
        })
        .retry(1)
        .then((res) => {
          return {
            success: true,
            data: JSON.parse(res.text)
          }
          // catch any runtime error
        }, (err) => {
          error(err);
          if (err.timeout) {
            return {
              success: false,
              error: 'API timeout'
            };
          } else {
            return {
              success: false,
              error: err
            };
          }
        });

      // else return 
    } else return {
      success: false,
      error: `Kindly Recharge Your OTP Account, Bal Left: ${fetchOtpBal.data}`
    };

    // catch any runtime error 
  } catch (e) {
    error(e);
    return {
      success: false,
      error: e
    };
  }
};