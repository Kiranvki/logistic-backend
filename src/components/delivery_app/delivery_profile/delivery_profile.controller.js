//controllers
const deliveryCtrl = require('../../employee/delivery_executive/delivery_executive.controller')
const AttendanceCtrl = require('../onBoard/app_delivery_user_attendance/app_delivery_user_attendance.controller');
const AppImageCtrl = require('./../../file_handler/images/images.controller')
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const profileModel = require('./models/delivery_profile.model');
const Model = require('../../employee/delivery_executive/models/delivery_executive.model')
const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const {
  error,
  info
} = require('../../../utils').logging;

// const BasicCtrl = require('../../basic_config/basic_config.controller');
const Promise = require("bluebird");
// getting the model 
// const Model = require('./models/images.model');
const CamelCase = require('camelcase');

// const _ = require('lodash');
const stream = require('stream');
const azureStorage = require('azure-storage');
const blobService = azureStorage.createBlobService();
const containerName = process.env.azureBlobContainerName;
// const {
//   downloadTheImageByURL
// } = require('../../../third_party_api/azure-storage');
const azureUrl = process.env.azureUploadUrl + containerName + '/';

// We are using timeout because the Flow is synchronised and inorder to get the final report we need to wait for 5 secs 
class timeout {
  sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}


// getting the model 
class deliveryProfileController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.employee;
  }


  // do something 
  getDeliveryUserDetails = async (req, res) => {
    try {
      info('Get Delivery Executive Details !');
      let date = new Date();
      let endOfTheDay = moment(date).set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0
      }).toDate();
      let startOfTheDay = moment(date).set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      // inserting the new user into the db
      let deliveryDetails = await deliveryCtrl.getdeliveryFullDetails(req.user._id);

      // is inserted 
      if (deliveryDetails.success && !_.isEmpty(deliveryDetails.data)) {
        // fetch the attendance 
        let attendanceDetails = await AttendanceCtrl.getAttendanceDetailsForADay(req.user._id, startOfTheDay, endOfTheDay)
          .then((data) => {
            if (data.success) {
              let totalWorkingInMins = 0;
              // get the total working in mins 
              if (data.data.attendanceLog && data.data.attendanceLog.length)
                totalWorkingInMins = _.sumBy(data.data.attendanceLog, 'totalWorkingInMins')
              return {
                isFirstCheckedIn: data.data.attendanceLog ? data.data.attendanceLog.length ? 1 : 0 : 0,
                attendanceLog: data.data.attendanceLog ? data.data.attendanceLog.length ? data.data.attendanceLog[data.data.attendanceLog.length - 1] : [] : [],
                totalWorkingInMinsTillLastCheckOut: totalWorkingInMins
              }
            } else return {
              isFirstCheckedIn: 0,
              attendanceLog: {},
              totalWorkingInMinsTillLastCheckOut: 0
            };
          });

        // success response 
        return this.success(req, res, this.status.HTTP_OK, {
          ...deliveryDetails.data,
          attendanceDetails: attendanceDetails
        }, this.messageTypes.userDetailsFetchedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.userNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // do something 
  updateDeliveryUserDetails = async (req, res) => {
    try {
      info('Delivery Executive Profile PATCH REQUEST !');
      let id = req.user._id || '';
      let toChangeObject = req.body;

      // inserting data into the db 
      let isUpdated = await deliveryCtrl.updateDetails(toChangeObject,id);
     
    
      // check if updated 
      if (isUpdated.success) return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.deliveryExecutiveUpdatedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.deliveryExecutiveNotUpdated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // upload image to the database 
  uploadImage = async (req, res) => {
    try {
      info('Uploading the Image to the DB !');
      let deliveryExId = req.params.deliveryExId ||req.query.deliveryExId || req.body.deliveryExId; // get the onboarding id
      // let customerName = req.body.onBoarding.name || req.params.deliveryExId;  // this has to eb changes
      // let type = req.body.type;

      // get the file name 
      let fileName = `customers/$-${deliveryExId}/`;
      let fileStream = req.body.fileInfo.b64;
      let streamLength = req.body.fileInfo.b64Length;

      // data
      let data = await blobService.createBlockBlobFromStream(containerName, fileName + `original-${req.body.fileInfo.originalName.trim()}`, fileStream, streamLength, err => {
        if (err) {
          error('Original Upload Fail', err);
          return {
            success: false
          };
        }
        console.log('IMAGE UPLOAD IS COMPLETED !');
        return {
          success: true
        }
      });

      let dataToUpdate = {
        $set: {
          photo: (azureUrl+data.name).trim(""),
        },
      };

      // inserting data into the db
      let isUpdated = await Model.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(deliveryExId),
        },
        dataToUpdate,
        {
          new: true,
          upsert: false,
          lean: true,
        }
      );

      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        id: deliveryExId,
        msg: isUpdated,
      }, this.messageTypes.fileSuccessfullyUploaded);

      // catch any runtime error 
    } catch (err) {
      error(err);
      return this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

}

// exporting the modules 
module.exports = new deliveryProfileController();
