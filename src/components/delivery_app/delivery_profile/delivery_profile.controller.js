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

      // inserting data into the db 
      let isUpdated = await deliveryCtrl.updateDetails(req.body.toChangeObject, id);


      let insertObject = {
        // goFrugalId: 0,
        // incoTermLocation: req.user.incoTermLocation,
        // salesDocumentType: req.user.salesDocumentType || 'ZDOM',
        // salesOrganization: req.user.salesOrg || '5000',
        // distributionChannel: req.user.distributionChannel || '50',
        // division: req.user.division || '51',
        // plant: req.user.plant || '1000',
        // storageLocation: req.user.storageLocation || '101',
        //priceLevelId: req.user.customerGroup || 'BB', //it will be cust group by default some value we are passing
        //  customerGroup: req.user.distributionChannel || '50', // it will be distribution channel
        /**
         * From backend we will have to assigned both the dist channel and customer_group
         */
        // priceLevelId: req.body.priceLevelId,  //here we will be getting the customer group (now it wont be taken from the user, it will be directly assigned to the user from the saleman-warehouse mapping)
        // customerGroup: req.body.group, //here it should be the distribution center(now we do not need to take it from front end, it will be taken from salesman)
        //cityId: req.user.cityId,

        // salesmanId: req.user._id,

        // contactPerson: req.body.contactPersonName,
        // mobileNumber: req.body.phoneNumber,
        // email: req.body.email,
        // address1: req.body.address1 || null,
        // address2: req.body.address2 || null,
        // latitude: req.body.latitude || null,
        // longitude: req.body.longitude || null,
        // location: {
        //   type: 'Point',
        //   coordinates: [!isNaN(req.body.longitude) ? req.body.longitude : null, !isNaN(req.body.latitude) ? req.body.latitude : null]
        // },
        // city: req.body.city || null,
        // pincode: req.body.pincode || null,
        // state: req.body.state || null,
        // dateOfOnBoarding: onboardingDate,
        // name: req.body.name,
        // step1: true,
        // status: 1,
        // isDeleted: 0,
        // isCustomerPosted: 0,
        photo: req.body.profilePhoto

      };

      // creating a new customer in local db
      let isInserted = await Model.create(insertObject).then((result) => {
        console.log(result, "result")
        if (!_.isEmpty(req.body.fileInfo))
          return AppImageCtrl.uploadInternal({ id: result._id }, req.body.fileInfo, 'image').then((data) => {
            return {
              success: true,
              data: data
            };
          });
        else return {
          success: false,
          data: data
        }
      });
      // console.log("inserteddata===>",isInserted,id)

      if (isInserted.success) {
        await Model.findByIdAndUpdate(isInserted.data.data.id, {
          originalImageId: isInserted.data.data.originalFileName,
          thumbnailImageId: isInserted.data.data.thumbNailFileName,
        });
      }
      console.log("dataUpdated", isInserted)

      // let result = {
      //   isUpdated: isUpdated,
      //   originalImageId : isInserted.data.originalImageId,
      //   thumbnailImageId : thumbnailImageId,
      // }
      console.log('profile pic uploaded Successfully ', isInserted.data)

      // check if updated 
      if (isUpdated.success) return this.success(req, res, this.status.HTTP_OK, result, this.messageTypes.deliveryExecutiveUpdatedSuccessfully);
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
