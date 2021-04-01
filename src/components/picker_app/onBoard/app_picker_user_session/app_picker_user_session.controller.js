// controller forget password 
const BaseController = require('../../../baseController');
const Model = require('./models/app_picker_user_session.model');
const camelCase = require('camelcase');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../../../../utils').logging;
const _ = require('lodash');

// getting the model 
class pickerUserSessionController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.appUserOnBoard;
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
        let pickerBoy = await Model.findOneAndUpdate({
          'pickerBoyId': mongoose.Types.ObjectId(req.body.pickerBoyDetails._id),
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
          pickerBoyId: req.body.pickerBoyDetails._id,
          pickerBoyDetails: {
            name: req.body.pickerBoyDetails.fullName,
            cityId: req.body.pickerBoyDetails.cityId,
            employeeId: req.body.pickerBoyDetails.employeeId,
            profilePic: req.body.pickerBoyDetails.profilePic,
          }
        }, this.messageTypes.otpRegeneratedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToGenerateOtpRightNow);
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // Internal Function to get user session data
  getUserSession = async (pickerBoyId) => {
    try {
      info('Getting User Session Data !');

      // get the asm list 
      return Model.find({
        pickerBoyId: mongoose.Types.ObjectId(pickerBoyId),
        status: 1,
        isDeleted: 0
      }).lean().then((res) => {
        if (res && res.length) {
          return {
            success: true,
            data: res[res.length - 1]
          }
        } else {
          error('Error Searching Data in Picker Boy DB!');
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

  // login verify
  loginVerify = async (req, res) => {
    try {
      info('Login Verify Token !');

      // getting the picker boy id
      let pickerBoyId = req.params.pickerBoyId,
        pickerBoyDetails = req.body.isValidPickerBoy;

      // login object 
      let loginDetailsObject = {
        'loggedInAt': new Date(),
        'loginIp': '',
        'loginLocation': ''
      };

      // updating the last login details 
      let isUpdated = await Model.findOneAndUpdate({
        'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId),
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
            _id: pickerBoyDetails._id,
            name: pickerBoyDetails.fullName,
            profilePic: pickerBoyDetails.profilePic,
            employeeId: pickerBoyDetails.employeeId,
            city: pickerBoyDetails.cityId,
            plant:pickerBoyDetails.plant
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
  getUserToken = async (pickerBoyId) => {
    try {
      info('Get the session key for the given picker id !');

      // checking day object 
      if (pickerBoyId) {

        // creating the data inside the database 
        return Model
          .findOne({
            'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId)
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
module.exports = new pickerUserSessionController();
