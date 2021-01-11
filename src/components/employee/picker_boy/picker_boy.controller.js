// controllers
const BasicCtrl = require('../../basic_config/basic_config.controller');
// const AsmSalesmanMappingCtrl = require('../asm_salesman_mapping/asm_salesman_mapping.controller');
// const DraftBeatPlanSalesmanCtrl = require('../../beat_plan/draft_salesman_mapping/draft_salesman_mapping.controller');
// const PublishedBeatPlanCtrl = require('../../beat_plan/published/published.controller');
// const DraftBeatPlanCtrl = require('../../beat_plan/draft/draft.controller');
const BaseController = require('../../baseController');
const mongoose = require('mongoose');
const Model = require('./models/picker_boy.model');
const { parse } = require('json2csv');
const {
  error,
  info
} = require('../../../utils').logging;
const _ = require('lodash');
const moment = require('moment');
// const {
//   postSalesmanOther
// } = require('../../../inter_service_api/recievables_server/v1');

// getting the model 
class PickerBoyController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.employee;
  }



  // create a new picker Boy
  post = async (req, res) => {
    try {
      info('Create a new Picker Boy !');

      // get the firstname
      req.body.firstName = req.body.isWaycoolEmp == false ? req.body.firstName.replace(
        /\w\S*/g,
        function (txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : req.body.userData.firstName.replace(
          /\w\S*/g,
          function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          });

      // sentence case the last name
      req.body.lastName = req.body.isWaycoolEmp == false ? req.body.lastName.replace(
        /\w\S*/g,
        function (txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : req.body.userData.lastName.replace(
          /\w\S*/g,
          function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          });

      // getting the full name 
      let fullName = `${req.body.firstName} ${req.body.lastName}`;

      // creating data to insert
      let dataToInsert = {
        ...req.body.userData,
        'firstName': req.body.firstName ? req.body.firstName : req.body.userData.firstName,
        'lastName': req.body.lastName ? req.body.lastName : req.body.userData.lastName,
        'isWaycoolEmp': req.body.isWaycoolEmp == true ? 1 : 0,
        'employerName': req.body.isWaycoolEmp == true ? 'Waycool Foods & Products Private Limited' : req.body.agencyName,
        'agencyId': req.body.isWaycoolEmp == true ? null : req.body.agencyId,
        'contactMobile': req.body.contactMobile,
        'email': req.body.email,
        'gender': req.body.isWaycoolEmp == true ? (req.body.userData.gender).toLowerCase() : (req.body.gender).toLowerCase(),
        'fullName': fullName,
        'createdById': req.user._id,
        'createdBy': req.user.email || 'admin',
        'warehouseId': mongoose.Types.ObjectId(req.user.warehouseId) || null,
        'cityId': req.body.cityId,
      }

      // checking if profile pic is present 
      if (req.body.profilePic)
        dataToInsert = {
          ...dataToInsert,
          'profilePic': req.body.profilePic
        }

      // if its not a waycool emp
      if (req.body.isWaycoolEmp == false)
        dataToInsert = {
          ...dataToInsert,
          'employeeId': req.body.empId,
          'firstName': req.body.firstName,
          'lastName': req.body.lastName,
          'photo': req.body.profilePic,
          'reportingTo': {
            'id': req.body.asmSalesmanMappingObject.asmId || '',
            'name': req.body.asmSalesmanMappingObject.name || '',
            'emailId': req.body.asmSalesmanMappingObject.emailId || ''
          }
        }

      // inserting data into the db 
      let isInserted = await Model.create(dataToInsert);

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        info('Salesman Successfully Created !');
        // returning success
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.salesmanCreated)
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesmanNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  create = async (req, res) => {
    try {
      info('Create a new Picker Boy !');

      // inserting data into the db 
      return Model.create(dataToInsert)
        .then((res) => {
          // check if inserted 
          if (res && !_.isEmpty(res))
            return {
              success: true,
              data: res
            };
          else return {
            success: false,
          }
        });

      // creating data to insert
      let dataToInsert = {
        ...req.body.userData,
        'firstName': req.body.firstName ? req.body.firstName : req.body.userData.firstName,
        'lastName': req.body.lastName ? req.body.lastName : req.body.userData.lastName,
        'isWaycoolEmp': req.body.isWaycoolEmp == true ? 1 : 0,
        'employerName': req.body.isWaycoolEmp == true ? 'Waycool Foods & Products Private Limited' : req.body.agencyName,
        'contactMobile': req.body.contactMobile,
        'email': req.body.email,
        'gender': req.body.isWaycoolEmp == true ? (req.body.userData.gender).toLowerCase() : (req.body.gender).toLowerCase(),
        'fullName': fullName,
        'cityId': req.body.cityId,
      }

      // checking if profile pic is present 
      if (req.body.profilePic)
        dataToInsert = {
          ...dataToInsert,
          'profilePic': req.body.profilePic
        }

      // if its not a waycool emp
      if (req.body.isWaycoolEmp == false)
        dataToInsert = {
          ...dataToInsert,
          'employeeId': req.body.empId,
          'firstName': req.body.firstName,
          'lastName': req.body.lastName,
          'photo': req.body.profilePic,
        }

      // inserting data into the db 
      let isInserted = await Model.create(dataToInsert);

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        info('Salesman Successfully Created !');
        // returning success
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.salesmanCreated)
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesmanNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  get = async (req, res) => {
    try {
      info("Employee GET DETAILS !");
      // get the brand id
      let employeeId = req.params.employeeId;
      // inserting data into the db
      // let transporter = await Model.findOne({
      // let employee = await Model.findById({

      //   _id: mongoose.Types.ObjectId(employeeId)

      // }).lean();

      let employee = await Model.findOne({
        _id: mongoose.Types.ObjectId(req.params.employeeId),
        isDeleted: 0,
      }).lean();
      console.log("Emplloyy", employee);
      // check if inserted
      if (employee && !_.isEmpty(employee))
        return this.success(req, res, this.status.HTTP_OK, employee);
      else return this.errors(req, res, this.status.HTTP_CONFLICT);

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  // get the picker list
  getList = async (req, res) => {
    try {
      info('Get picker boy List !');
      let page = req.params.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        // type = req.query.type == 'mapped' ? true : false,
        sortingArray = {};
      // asmMappingCond = {
      //   'status': 1,
      //   'isDeleted': 0,
      // };

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // city filter for allocated city 
      let searchObject = {
        'isDeleted': 0,
      };

      // if status is active 
      if (req.query.status && req.query.status == 'active')
        searchObject = {
          'isDeleted': 0,
          'status': 1,
        };
      else if (req.query.status && req.query.status == 'inactive')
        searchObject = {
          'isDeleted': 0,
          'status': 0,
        };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'employeeId': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'firstName': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };


      // get the total picker boy
      let totalPickerBoy = await Model.countDocuments({
        ...searchObject
      });

      // get the picker boy list
      let pickerBoyList = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      },
      {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
      }]).allowDiskUse(true);



      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: pickerBoyList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalPickerBoy
        }
      }, this.messageTypes.pickerBoyListFetchedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }



  // get details of picker
  getDetails = async (pickerBoyId) => {
    try {
      info('Get picker details !');

      // find the picker
      // get details 
      return Model.aggregate([{
        $match: {
          '_id': mongoose.Types.ObjectId(pickerBoyId),
          'status': 1,
          'isDeleted': 0
        }
      }
      ]).allowDiskUse(true).then((res) => {
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
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // Internal function to update the details
  updateDetails = async (dataObject, id) => {
    try {
      info('Update picker details Internal Function !');

      // creating data to insert
      let dataToUpdate = {
        $set: {
          ...dataObject
        }
      };

      return Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(id)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      }).then((res) => {
        if (res) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Updating Data in Picker Boy DB!');
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
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

      // // // patch the request 
      updatePickerBoyDetails = async (req, res) => {
        try {
    
          info('Employee CHANGE ! !');

          // creating data to insert
          let dataToUpdate = {
            $set: {
              ...req.body,
            }
          };
    
          // inserting data into the db 
          let isUpdated = await Model.findOneAndUpdate({
            _id: mongoose.Types.ObjectId(req.query.employeeId)
          }, dataToUpdate, {
            new: true,
            upsert: false,
            lean: true
          });
    
          // check if inserted 
          if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated);
          else return this.errors(req, res, this.status.HTTP_CONFLICT);
    
          // catch any runtime error 
        } catch (err) {
          error(err);
          this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
      }

  // get pickerBoyData details
  getPickerBoyDetails = async (req, res) => {
    try {
      info('pickerBoy GET DETAILS !');

      // get pickerBoy details
      let pickerBoyData = await Model.aggregate([{
        $match: {
          _id: mongoose.Types.ObjectId(req.params.pickerBoyId)
        }
      }]).allowDiskUse(true);

      // check if inserted 
      if (pickerBoyData && pickerBoyData.length) return this.success(req, res, this.status.HTTP_OK, pickerBoyData[pickerBoyData.length - 1], this.messageTypes.pickerBoyDetailsFetchedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.pickerBoyDetailsNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // getting the picker boy details using other fields 
  getDetailsUsingField = async (fieldValue) => {
    try {
      info('Get  picker boy details !');

      // find the  picker boy

      return await Model
        .aggregate([{
          $match: {
            '$or': [{
              'email': fieldValue
            },
            {
              'contactMobile': fieldValue
            }],
            'status': 1,
            'isDeleted': 0
          }
        }])
        .allowDiskUse(true)
        .then((res) => {
          if (res && res.length) {
            return {
              success: true,
              data: res[res.length - 1]
            }
          } else {
            error('Error Searching Data in  picker boy DB!');
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
    }
  }

  // Internal Function get full details 
  getPickerBoyFullDetails = async (pickerBoyId) => {
    try {
      info('PickerBoy GET DETAILS !');

      // get picker boy details
      let pickerBoyData = await Model.aggregate([{
        $match: {
          _id: mongoose.Types.ObjectId(pickerBoyId)
        }
      }
      ]).allowDiskUse(true);

      // check if inserted 
      if (pickerBoyData && pickerBoyData.length) return {
        success: true,
        data: pickerBoyData[pickerBoyData.length - 1]
      };
      else return { success: false };

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }


<<<<<<< HEAD
//delete employee
=======
  
>>>>>>> d21e31f888bc0b9755a0200ca92ceae329af88c6
  deleteEmployee = async (req, res) => {
    try {
      info("Employee Delete!");
      //let employeeId = req.query.employeeId;
      // inserting the new user into the db
<<<<<<< HEAD
      let employeeId = req.params.employeeId || "";
=======
       let employeeId = req.query.employeeId || "";
>>>>>>> d21e31f888bc0b9755a0200ca92ceae329af88c6

      // creating data to update
      let dataToUpdate = {
        $set: {
          // status: 0,
          isDeleted: 1
        }
      };

      // inserting data into the db 
    //   let isUpdated = await Model.findOneAndUpdate({
        let isUpdated = await Model.updateOne({
        _id: mongoose.Types.ObjectId(employeeId)
      },
     dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
     }
      )
      // .then(async (res) => {

      // if (req.body.asmSalesmanMappingIds && Array.isArray(req.body.asmSalesmanMappingIds) && req.body.asmSalesmanMappingIds.length)
      //   return AsmSalesmanCtrl.disableWithIdsArray(req.body.asmSalesmanMappingIds).then((isMappingDeleted) => { if (isMappingDeleted.success) return true; else return false });
      // else 
      //   return true
      // });

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, {});
      else return this.errors(req, res, this.status.HTTP_CONFLICT);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

 // patch Pickerboy status
  // patchPickerboyStatus = async (req, res) => {
  //   try {
  //     info('Pickerboy STATUS CHANGE !');
  //     let type = req.params.type,
  //     pickerboyId = req.params.pickerboyId;
  //     // creating data to insert
  //     let dataToUpdate = {
  //       $set: {
  //         status: type == 'activate' ? 1 : 0
  //       }
  //     };

  //     // inserting data into the db 
  //     let isUpdated = await Model.findOneAndUpdate({
  //       _id: mongoose.Types.ObjectId(pickerboyId)
  //     }, dataToUpdate, {
  //       new: true,
  //       upsert: false,
  //       lean: true
  //     });

  //     // check if inserted 
  //     if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, type == 'activate' ? this.messageTypes.pickerboyActivatedSuccessfully : this.messageTypes.pickerboyDeactivatedSuccessfully);
  //     else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.pickerboyNotUpdated);

  //     // catch any runtime error 
  //   } catch (err) {
  //     error(err);
  //     this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  //   }
  // }

}

// exporting the modules 
module.exports = new PickerBoyController();
