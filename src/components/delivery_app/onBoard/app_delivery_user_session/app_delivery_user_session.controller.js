// controller forget password 
const BaseController = require('../../../baseController');
const Model = require('./models/app_delivery_user_session.models');
const camelCase = require('camelcase');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../../../../utils').logging;
const _ = require('lodash');

class deliveryUserSessionController extends BaseController {
    constructor() {
      super();
      this.messageTypes = this.messageTypes.appUserOnBoard;
    }
  // Internal Function to get user session data
  getUserSession = async (deliveryId) => {
    try {
      info('Getting Security User Session Data !');

      // get the asm list 
      return Model.find({
        deliveryId: mongoose.Types.ObjectId(deliveryId),
        status: 1,
        isDeleted: 0
      }).lean().then((res) => {
        if (res && res.length) {
          return {
            success: true,
            data: res[res.length - 1]
          }
        } else {
          error('Error Searching Data in Security Guard Session DB!');
          return {
            success: false
          }
        }
      }).catch(err => {
        error(err);
        return {
          success: false,
          error: err
        }
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

   // do something 
   create = async (req, res) => {
    try {
      info('Creating a new user !');

      // inserting the new user into the db
      let isInserted = await Model.create({
        ...req.body,
        designation: camelCase(req.body.designation)
      })

      // is inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        // success response 
        isInserted.password = undefined;
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.userCreatedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.userNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

    // login authentication
    loginRequest = async (req, res) => {
      try {
        info('OTP generation and DB entry !');
  
        // getting the salesman id 
        let otpObject = req.body.otpObject || {};
  
        // checking if otp object is valid 
        if (!_.isEmpty(otpObject)) {
  
          // creating the push object 
          let pushObject = {
            'otp': otpObject.otp,
            'createdAt': otpObject.otpCreatedDate,
            'expiryInMin': otpObject.expiryTimeForAppToken,
            'otpType': req.params.type,
            'requestId': otpObject.reqId,
            'status': 1,
            'email': req.body.email,
            'mobileNumber': req.body.mobileNumber,
          };
  
          // updating the last login details 
          let deliveryExecutive = await Model.findOneAndUpdate({
            'deliveryId': mongoose.Types.ObjectId(req.body.deliveryId._id),
            'status': 1,
            'isDeleted': 0
          }, {
            $push: {
              'otpSend': pushObject
            }
          }, {
            'upsert': true,
            'new': true
          });
  
          // is logged in 
          return this.success(req, res, this.status.HTTP_OK, {
            deliveryId: req.body.deliveryExecutiveDetails._id,
            deliveryExecutiveDetails: {
              name: req.body.deliveryExecutiveDetails.fullName,
              cityId: req.body.deliveryExecutiveDetails.cityId,
              employeeId: req.body.deliveryExecutiveDetails.employeeId,
              profilePic: req.body.deliveryExecutiveDetails.profilePic,
            }
          }, this.messageTypes.otpRegeneratedSuccessfully);
        } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToGenerateOtpRightNow);
        // catch any runtime error 
      } catch (err) {
        error(err);
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
      }
    }
  
  // login verify
  loginVerify = async (req, res) => {
    try {
      info('Login Verify Token !');

      // getting the picker boy id
      let deliveryId = req.params.deliveryId,
      deliveryExecutiveDetails = req.body.isValidDeliveryExecutive;

      // login object 
      let loginDetailsObject = {
        'loggedInAt': new Date(),
        'loginIp': '',
        'loginLocation': ''
      };

      // updating the last login details 
      let isUpdated = await Model.findOneAndUpdate({
        'deliveryId': mongoose.Types.ObjectId(deliveryId),
      }, {
        $set: {
          'otpSend.$[otpSend].status': 1, // OTP is now verified
          'sessionKey': req.body.token,
          'firebaseKey': req.body.deviceToken,
        },
        $push: {
          'loginDetails': loginDetailsObject
        }
      }, {
        'arrayFilters': [
          { 'otpSend.status': 1 }
        ]
      });

      // if data is updated 
      if (!_.isEmpty(isUpdated)) {
        // is logged in 
        return this.success(req, res, this.status.HTTP_OK, {
          sessionKey: req.body.token,
          expiryInMin: req.body.expiryTimeInMin,
          userDetails: {
            _id: deliveryExecutiveDetails._id,
            name: deliveryExecutiveDetails.fullName,
            profilePic: deliveryExecutiveDetails.profilePic,
            employeeId: deliveryExecutiveDetails.employeeId,
            city: deliveryExecutiveDetails.cityId
          }
        }, this.messageTypes.userLoggedInSuccessfully);

      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToGenerateOtpRightNow);
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
  
  // get valid user token 
  getUserToken = async (securityGuardId) => {
    try {
      info('Get the session key for the given Delivery Executive id !');

      // checking day object 
      if (deliveryId) {

        // creating the data inside the database 
        return Model
          .findOne({
            'deliveryId': mongoose.Types.ObjectId(deliveryId)
          })
          // .select('sessionKey')
          .select({
            'sessionKey': 1,
            //      'recSessionKey': 1
          })
          .lean()
          .then((res) => {
            if (res)
              return {
                success: true,
                data: res
              };
            else return {
              success: false
            }
          });
      } else return {
        success: false
      };

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }
  }

// exporting the modules 
module.exports = new deliveryUserSessionController();