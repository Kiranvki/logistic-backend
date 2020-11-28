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

  // Internal Function to check whether the salesman exist or not
  isSalesmanExist = async (empId, cityId, isWaycoolEmployer, agencyId) => {
    try {
      info('Checking whether the Salesman already exist or not !', empId);

      let searchObject = {
        'employeeId': empId,
        'cityId': cityId,
        'isDeleted': 0,
      };

      // if waycool employee
      if (isWaycoolEmployer) {
        searchObject = {
          ...searchObject,
          'isWaycoolEmp': 1
        }
      } else if (!isWaycoolEmployer) {
        searchObject = {
          ...searchObject,
          'isWaycoolEmp': 0,
          'agencyId': mongoose.Types.ObjectId(agencyId)
        }
      }

      // creating the data inside the database 
      return Model
        .findOne({
          ...searchObject
        })
        .lean()
        .then((res) => {
          if (res && !_.isEmpty(res))
            return {
              success: true,
              data: res
            };
          else return {
            success: false
          }
        });
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // Internal Function to check whether the salesman exist or not
  isExist = async (empId, cityId, isWaycoolEmployer) => {
    try {
      info('Checking whether the Salesman already exist or not !', empId);

      // creating the data inside the database 
      return Model
        .findOne({
          'cityId': cityId,
          'employeeId': empId,
          'isWaycoolEmp': isWaycoolEmployer,
          'isDeleted': 0
        })
        .lean()
        .then((res) => {
          if (res && !_.isEmpty(res))
            return {
              success: true,
            };
          else return {
            success: false
          }
        });
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
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

  // get the picker list
  getList = async (req, res) => {
    try {
      info('Get picker boy List !');
      let page = req.query.page || 1,
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

  // get the onboarded customers list
  getTheListOfOnBoardedCustomers = async (req, res) => {
    try {
      info('Get Sa!esman Onboarded Customers list !');

      // check if inserted 
      return this.success(req, res, this.status.HTTP_OK, {
        ...req.body.onbaordedCustomerList
      }, this.messageTypes.onboardedCustomersList);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get details of picker
  getDetails = (pickerBoyId) => {
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

  // get details without status comparison
  getDetailsWithoutStatus = (salesmanId) => {
    try {
      info('Get Salesman details !');

      // get details 
      return Model.findOne({
        _id: mongoose.Types.ObjectId(salesmanId),
        isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in Salesman DB!');
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

  // patch the salesman status
  patchSalesmanStatus = async (req, res) => {
    try {
      info('ASM STATUS CHANGE !');

      // type id 
      let type = req.params.type,
        salesmanId = req.params.salesmanId;

      // creating data to insert
      let dataToUpdate = {
        $set: {
          status: type == 'activate' ? 1 : 0
        }
      };

      // get the draft id 
      let beatPlanId = await DraftBeatPlanSalesmanCtrl.getTheBeatPlanCreatedForSalesman(salesmanId);
      if (beatPlanId.success) beatPlanId = beatPlanId.data.beatPlanId;
      else beatPlanId = undefined;

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(salesmanId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      }).then(async (response) => {
        if (response) {
          if (type == 'deactivate') {
            // update the draft and published beat plan salesman status 
            return DraftBeatPlanSalesmanCtrl.disableUsingSalesmanId(salesmanId).then(async (data) => {
              if (beatPlanId) {
                await DraftBeatPlanCtrl.deleteUsingId(beatPlanId)
              }
              return {
                success: true
              }
            });
            // // update the draft and published beat plan salesman status 
            // return DraftBeatPlanSalesmanCtrl.disableUsingSalesmanId(salesmanId).then((data) => {
            //   return PublishedBeatPlanCtrl.disableUsingSalesmanId(salesmanId).then((data) => {
            //     return {
            //       success: true
            //     }
            //   });
            // });
          } else {
            return { success: true }
          }
        } else return null;
      });

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, type == 'activate' ? this.messageTypes.salesmanActivatedSuccessfully : this.messageTypes.salesmanDeactivatedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesmanNotUpdated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // delete salesman 
  deleteSalesman = async (req, res) => {
    try {
      info('Salesman Delete !');

      // Salesman id  
      let salesmanId = req.params.salesmanId;

      // creating data to insert
      let dataToUpdate = {
        $set: {
          status: 0,
          isDeleted: 1
        }
      };

      // get the draft id 
      let beatPlanId = await DraftBeatPlanSalesmanCtrl.getTheBeatPlanCreatedForSalesman(salesmanId);
      if (beatPlanId.success) beatPlanId = beatPlanId.data.beatPlanId;
      else beatPlanId = undefined;

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(salesmanId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      }).then((res) => {
        // update the draft and published beat plan salesman status 
        return DraftBeatPlanSalesmanCtrl.disableUsingSalesmanId(salesmanId).then(async (data) => {
          if (beatPlanId) {
            await DraftBeatPlanCtrl.deleteUsingId(beatPlanId)
          }
          return {
            success: true
          }
        });
      });

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.salesmanDeletedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesmanNotDeletedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // patch salesman 
  patchSalesman = async (req, res) => {
    try {
      info('Patch Salesman !');

      // Salesman id  
      let salesmanId = req.params.salesmanId;

      // creating data to insert
      let dataToUpdate = {
        $set: {
          ...req.body.toChangeObject
        }
      };

      // checking if profile pic is present 
      if (req.body.profilePic != undefined)
        dataToUpdate = {
          ...dataToUpdate,
          'profilePic': req.body.profilePic || null
        }

      // if asm mapping is changed 
      if (req.body.asmMappingChangeObject && !_.isEmpty(req.body.asmMappingChangeObject)) {
        let isMappingDone = await AsmSalesmanMappingCtrl.deletedAsmSalesmanMapping(salesmanId).then((response) => {
          if (response.success) {
            return AsmSalesmanMappingCtrl.create(req.body.asmMappingChangeObject, req.user).then(() => {
              return true
            });
          } else false;
        });
        if (!isMappingDone) return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesmanNotUpdatedSuccessfully);
      }

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(salesmanId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      });

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.salesmanUpdatedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesmanNotUpdatedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // check whether the salesman ids is valid or not 
  isValidSalesmanIds = (salesmanIds) => {
    try {
      info('Check whether the salesman Ids are valid or not !');

      // find the salesmans
      return Model.find({
        '_id': {
          $in: salesmanIds
        },
        'status': 1,
        'isDeleted': 0
      }).lean().then((res) => {
        if (res && res.length) {
          return {
            success: true,
            data: res.map((data) => (data._id).toString())
          }
        } else {
          error('Error Searching Data in Salesman DB!');
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

  // patch salesman asm bulk mapping update 
  patchSalesmanAsmBulkMappingUpdate = async (req, res) => {
    try {
      info('Patch Salesman !');

      let salesmanIds = req.body.salesmanIds, // Salesman id  
        asmId = req.body.reportingManagerId; // asm id 

      // if asm mapping is changed 
      for (let i = 0; i < salesmanIds.length; i++) {

        // is mapping done 
        let isMappingDone = await AsmSalesmanMappingCtrl.deletedAsmSalesmanMapping(salesmanIds[i]).then((response) => {
          if (response.success) {
            return AsmSalesmanMappingCtrl.create({
              asmId: asmId,
              salesmanId: salesmanIds[i]
            }, req.user).then(() => {
              return true
            });
          } else false;
        });

        if (!isMappingDone) { return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesmanNotUpdatedSuccessfully); break; }
      }

      // check if inserted 
      return this.success(req, res, this.status.HTTP_OK, {
        salesmanIds,
        asmId
      }, this.messageTypes.salesmanUpdatedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get salesman minified list 
  getListMinified = async (req, res) => {
    try {
      info('Get Salesman List !');
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // project data 
      let dataToProject = {
        firstName: 1,
        lastName: 1,
        employeeId: 1,
        status: 1,
      }

      // city filter for allocated city 
      let searchObject = {
        'isDeleted': 0,
        'cityId': req.user.region[0] || 'chennai',
        '_id': {
          $in: req.body.validSalesmanId
        }
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
          }, {
            'fullName': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // get the total customer
      let totalSalesman = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      }, {
        $count: 'sum'
      }]).allowDiskUse(true);

      // calculating the total number of applications for the given scenario
      if (totalSalesman[0] !== undefined)
        totalSalesman = totalSalesman[0].sum;
      else
        totalSalesman = 0;

      // get the asms list 
      let salesmanList = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      }, {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
      }, {
        $project: {
          'fullName': 1,
          'employerName': 1,
          'profilePic': 1,
          'employeeId': 1
        }
      }]).allowDiskUse(true);

      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: salesmanList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalSalesman
        }
      }, this.messageTypes.userDetailsFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get the list for filter
  getListForFilter = async (req, res) => {
    try {
      info('Get Salesman List !');
      let searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {};

      sortingArray[sortBy] = -1;

      // city filter for allocated city 
      let searchObject = {
        'isDeleted': 0,
        'cityId': req.user.region[0] || 'chennai',
        '_id': {
          $in: req.body.validSalesmanId
        }
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
          }, {
            'fullName': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // get the asms list 
      let salesmanList = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      }, {
        $project: {
          'fullName': 1,
          'employerName': 1,
          'profilePic': 1,
          'employeeId': 1
        }
      }]).allowDiskUse(true);

      // success 
      return this.success(req, res, this.status.HTTP_OK, salesmanList, this.messageTypes.userDetailsFetched);

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

  // get all salesman with city name
  getAllSalesmanWithCityName = async (city) => {
    try {
      info('Get the Salesman List ! for ', city);

      // project data 
      let dataToProject = {
        'warehouseId': 1,
        'agencyId': 1,
        'employeeId': 1,
        'employerName': 1,
        '_id': 1,
        'status': 1,
        'type': 1,
        'dbStatus': 1,
        'isDeleted': 1,
        'cityId': 1
      }

      // search object
      let searchObject = { 'cityId': city, 'isDeleted': 0 };

      // getting th data from the customer db
      let salesmanList = await Model.aggregate([{
        '$project': dataToProject
      }, {
        '$match': {
          ...searchObject
        }
      }]).allowDiskUse(true);

      // success
      return {
        success: true,
        data: salesmanList
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

  // get all salesman with city name
  getAllSalesmanWithCityNameWithAsm = async (city) => {
    try {
      info('Get the Salesman List ! for ', city);

      // project data 
      let dataToProject = {
        'warehouseId': 1,
        'agencyId': 1,
        'employeeId': 1,
        'employerName': 1,
        'fullName': 1,
        '_id': 1,
        'status': 1,
        'type': 1,
        'dbStatus': 1,
        'isDeleted': 1,
        'cityId': 1
      }

      // search object
      let searchObject = { 'cityId': city, 'isDeleted': 0 };

      // getting th data from the customer db
      let salesmanList = await Model.aggregate([{
        '$project': dataToProject
      }, {
        '$match': {
          ...searchObject
        }
      }, {
        '$lookup': {
          from: 'asmsalesmanmappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$salesmanId', '$$id']
                }
              }
            }, {
              $project: {
                'status': 1,
                'isDeleted': 1,
                'asmId': 1,
                'salesmanId': 1,
              }
            }, {
              '$lookup': {
                from: 'areasalesmanagers',
                let: {
                  'id': '$asmId'
                },
                pipeline: [
                  {
                    $match: {
                      'status': 1,
                      'isDeleted': 0,
                      '$expr': {
                        '$eq': ['$_id', '$$id']
                      }
                    }
                  }, {
                    $project: {
                      'fullName': 1,
                      'employeeId': 1,
                      'employerName': 1
                    }
                  }
                ],
                as: 'asm'
              }
            }, {
              $unwind: {
                path: '$asm',
                preserveNullAndEmptyArrays: true
              }
            }
          ],
          as: 'asmMapping'
        }
      }, {
        $unwind: {
          path: '$asmMapping',
          preserveNullAndEmptyArrays: true
        }
      }, {
        '$lookup': {
          from: 'warehouses',
          let: {
            'id': '$warehouseId'
          },
          pipeline: [
            {
              $match: {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$_id', '$$id']
                }
              }
            }, {
              $project: {
                'name': 1,
              }
            }
          ],
          as: 'warehouse'
        }
      }, {
        $unwind: {
          path: '$warehouse',
          preserveNullAndEmptyArrays: true
        }
      }]).allowDiskUse(true);

      // success
      return {
        success: true,
        data: salesmanList
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

  // get all salesman for the warehouse
  getAllSalesmanWithCityNameWithAsmWithWarehouse = async (city, warehouseId) => {
    try {
      info('Get the Salesman List ! for ', city);

      // project data 
      let dataToProject = {
        'warehouseId': 1,
        'agencyId': 1,
        'employeeId': 1,
        'employerName': 1,
        'fullName': 1,
        '_id': 1,
        'status': 1,
        'type': 1,
        'dbStatus': 1,
        'isDeleted': 1,
        'cityId': 1
      }

      // search object
      let searchObject = { 'cityId': city, 'isDeleted': 0, 'warehouseId': mongoose.Types.ObjectId(warehouseId) };

      // getting th data from the customer db
      let salesmanList = await Model.aggregate([{
        '$project': dataToProject
      }, {
        '$match': {
          ...searchObject
        }
      }, {
        '$lookup': {
          from: 'asmsalesmanmappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$salesmanId', '$$id']
                }
              }
            }, {
              $project: {
                'status': 1,
                'isDeleted': 1,
                'asmId': 1,
                'salesmanId': 1,
              }
            }, {
              '$lookup': {
                from: 'areasalesmanagers',
                let: {
                  'id': '$asmId'
                },
                pipeline: [
                  {
                    $match: {
                      'status': 1,
                      'isDeleted': 0,
                      '$expr': {
                        '$eq': ['$_id', '$$id']
                      }
                    }
                  }, {
                    $project: {
                      'fullName': 1,
                      'employeeId': 1,
                      'employerName': 1
                    }
                  }
                ],
                as: 'asm'
              }
            }, {
              $unwind: {
                path: '$asm',
                preserveNullAndEmptyArrays: true
              }
            }
          ],
          as: 'asmMapping'
        }
      }, {
        $unwind: {
          path: '$asmMapping',
          preserveNullAndEmptyArrays: true
        }
      }, {
        '$lookup': {
          from: 'warehouses',
          let: {
            'id': '$warehouseId'
          },
          pipeline: [
            {
              $match: {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$_id', '$$id']
                }
              }
            }, {
              $project: {
                'name': 1,
              }
            }
          ],
          as: 'warehouse'
        }
      }, {
        $unwind: {
          path: '$warehouse',
          preserveNullAndEmptyArrays: true
        }
      }]).allowDiskUse(true);

      // success
      return {
        success: true,
        data: salesmanList
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

  // get salesman metrics
  getSalesmanMetrics = (req, res) => {
    try {
      info('Getting salesman Metrics !');

      // success 
      return this.success(req, res, this.status.HTTP_OK, req.body.adoptionObjOnDates, this.messageTypes.salesmanReportFetchedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get salesman metric details 
  getSalesmanMetricsDetails = (req, res) => {
    try {
      info('Getting salesman Metrics !');

      // success 
      return this.success(req, res, this.status.HTTP_OK, req.body.reportDetails, this.messageTypes.salesmanReportFetchedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // download salesman metrics
  downloadSalesmanMetrics = async (req, res) => {
    try {
      info('Triggering Downloading the Draft Bulk CSV template!');
      if (req.query.type == 'csv') {
        const fields = ['asm', 'asmEmployer', 'asmId', 'salesmanId', 'salesmanEmployer', 'salesman', '_id', 'date', 'attendanceOfSalesman', 'noOfCustomers', 'storesCheckedIn', 'collectionAmount'];
        if (req.body.adoptionObjOnDates && req.body.adoptionObjOnDates.length) {
          let csv = parse(req.body.adoptionObjOnDates, fields);

          res.setHeader('Content-disposition', `attachment; filename=adoptionMatrix-${req.query.city}.csv`);
          res.set('Content-Type', 'text/csv');
          res.status(200).send(csv);
        } else this.errors(req, res, this.status.HTTP_NOT_FOUND, this.messageTypes.unableToDownload(req.query.type));
      } else {
        this.errors(req, res, this.status.HTTP_NOT_FOUND, this.messageTypes.unableToDownload(req.query.type));
      }

      // downloading the file with the response 
    } catch (e) {
      error(e);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, e));
    }
  }
}

// exporting the modules 
module.exports = new PickerBoyController();
