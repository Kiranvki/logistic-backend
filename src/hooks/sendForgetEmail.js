// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const pug = require('pug');
const path = require('path');
const nodemailer = require("nodemailer");
const base64Img = require('base64-img');
const mailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.smtp_email,
    pass: process.env.smtp_password
  }, tls: {
    rejectUnauthorized: false
  }
});

// response handler
const {
  error,
  info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Send Email !');
    // getting the token expiry time 
    let emailId = req.body.email,
      returnEmail = req.body.email,
      userName = req.body.userName; // get the email id 
    let hashLink;
    let email;
    let emailAccountTemplatesPath = path.join('email-templates', 'account')
    let templatePath;
    let compiledHTML;
    let frontEndHost = process.env.frontEndHost || '',
      frontEndPort = process.env.frontEndPort || '',
      frontEndUrlForgetPassword = process.env.frontEndUrlForgetPassword || '';

    // get the hash link
    hashLink = frontEndHost + frontEndPort + frontEndUrlForgetPassword + '/' + req.body.token + '/email/' + emailId + '/portal-type/' + req.body.portalType;
    email = emailId;
    templatePath = path.join(__dirname, '../../src/', emailAccountTemplatesPath, 'reset-password.pug');
    let imagePath = path.join(__dirname, '../../public/', 'images/logo.jpeg');

    // compiled html
    compiledHTML = await pug.compileFile(templatePath)({
      logo: base64Img.base64Sync(imagePath),
      name: userName,
      hashLink,
      returnEmail
    });

    // email object 
    let email_obj = {
      from: process.env.smtp_email,
      to: emailId,
      subject: 'Reset Password',
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
    mailTransporter.sendMail(mailDetails, function (err, data) {
      if (err) {
        console.error('Error Occurs', err);
        return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, MessageTypes.userAuthentication.forgetPasswordEmailNotSend);
      } else {
        info('Email sent successfully');
        next();
      }
    });

  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
