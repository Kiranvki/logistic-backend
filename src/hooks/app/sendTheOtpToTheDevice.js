// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const BasicCtrl = require('../../components/basic_config/basic_config.controller');
const pug = require('pug');
const path = require('path');
const nodemailer = require("nodemailer");
const mailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.smtp_email,
    pass: process.env.smtp_password
  },
});
const {
  sendOtp, // send otp
} = require('../../third_party_api/notification')
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Triggering the OTP service !');

    // get the template id
    const otpTemplate = await BasicCtrl.GET_OTP_TEMPLATE_ID().then((res) => { if (res.success) return res.data; else return '5f2417bed6fc05491a428f68'; });
    let type = req.params.type || req.body.type, // getting the otp type
      otpObject = req.body.otpObject, // getting the otp object 
      mobileNumber = req.body.mobileNumber || undefined,
      email = req.body.email || undefined,
      isSendOtp = false;

    // checking whether the type is sms 
    if (type == 'sms' && mobileNumber) {
      info('Triggering OTP message !');

      // set by default
      let isSend = {
        success: true,
        data: {
          request_id: '306745777833363233353939'
        }
      };

      // send otp if allowed
      if (parseInt(process.env.sendSms) == 1)
        isSend = await sendOtp(mobileNumber, otpTemplate, otpObject.otp, otpObject.expiryTimeForAppToken);

      // if otp is send 
      if (isSend.success) {
        info('OTP Send Successfully !');

        // injecting into the request body 
        req.body.otpObject = { ...req.body.otpObject, reqId: isSend.data.request_id, otpCreatedDate: new Date() };
        isSendOtp = true;
      } else {
        error('ERROR WHILE SENDING OTP !');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.appUserOnBoard.invalidOtpServer(isSend.error));
      }
    } else {
      let emailAccountTemplatesPath = path.join('email-templates', 'account')
      let templatePath;
      let compiledHTML;
      templatePath = path.join(__dirname, '../../../src/', emailAccountTemplatesPath, 'otp-verification.pug');

      // compiled html
      compiledHTML = await pug.compileFile(templatePath)({
        otp: otpObject.otp,
        expiry: otpObject.expiryTimeForAppToken
      });

      // email object 
      let email_obj = {
        from: process.env.smtp_email,
        to: email,
        subject: 'OTP for Login!',
        html: compiledHTML
      };

      // mail details 
      let mailDetails = {
        from: email_obj.from,
        to: email_obj.to,
        subject: email_obj.subject || '',
        html: email_obj.html || ''
      };

      // mail transporter
      await new Promise((resolve, reject) => {
        mailTransporter.sendMail(mailDetails, function (err, data) {
          if (err) {
            console.error('Error Occurs', err);
            return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, MessageTypes.appUserOnBoard.unableToSendEmailOtp);
          } else {
            info('Email sent successfully to - ', email);
            req.body.otpObject = { ...req.body.otpObject, reqId: data.messageId, otpCreatedDate: new Date() };
            isSendOtp = true;
            resolve(true);
          }
        });
      })
    }

    // move on 
    return next()

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
