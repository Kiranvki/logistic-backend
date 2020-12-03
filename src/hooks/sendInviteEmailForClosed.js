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
  },
});

// response handler
const {
  error,
  info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Sending Invite Email !');

    // invite send 
    let inviteSend = [],
      inviteNotSend = [];

    // get the portal type 
    let portalType = req.body.portalType || 'admin';

    // get the firstname
    req.body.firstName = req.body.firstName.replace(
      /\w\S*/g,
      function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });

    // sentence case the last name
    req.body.lastName = req.body.lastName.replace(
      /\w\S*/g,
      function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });

    // getting the full name 
    let fullName = `${req.body.firstName} ${req.body.lastName}`;

    let email = req.body.email,
      passwordToEmail = req.body.actualPassword;
    let emailAccountTemplatesPath = path.join('email-templates', 'account')
    let templatePath;
    let compiledHTML;

    // if portal type is admin
    if (portalType == 'brand')
      templatePath = path.join(__dirname, '../../src/', emailAccountTemplatesPath, 'new-user-brand.pug');
    else
      templatePath = path.join(__dirname, '../../src/', emailAccountTemplatesPath, 'new-user.pug');

    let imagePath = path.join(__dirname, '../../public/', 'images/logo.jpeg');

    // compiled html
    compiledHTML = await pug.compileFile(templatePath)({
      logo: base64Img.base64Sync(imagePath),
      url: portalType == 'brand' ? process.env.brandFrontEndHost + process.env.brandFrontEndPort : process.env.frontEndHost + process.env.frontEndPort,
      name: fullName,
      email: email,
      password: passwordToEmail
    });

    // email object 
    let email_obj = {
      from: process.env.smtp_email,
      to: email,
      subject: 'Welcome to Waycool DMS!',
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
          inviteNotSend.push({
            email: email,
            error: err
          })
          resolve(true);
        } else {
          info('Email sent successfully to - ', email);
          inviteSend.push(email);
          resolve(true);
        }
      });
    })

    // injecting the send and not send email 
    req.params.inviteNotSend = inviteNotSend || [];
    req.params.inviteSend = inviteSend || [];

    // move on
    return next();

  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
