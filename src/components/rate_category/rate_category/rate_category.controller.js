const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/rate_category.model');
const rateTransporterVehicleMappingCtrl = require('../ratecategory_transporter_vehicle_mapping/ratecategory_transporter_vehicle_mapping.controller');
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

//getting the model 
class rateCategoryController extends BaseController {
  //constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.rateCategory;
  }

  // Internal Function get rateCategory  details
  getDetails = async (rateCategoryId) => {
    try {
      info('Get Rate Category  details !');

      // get details 
      return Model.findOne({
        _id: mongoose.Types.ObjectId(rateCategoryId),
        isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in Rate Category DB!');
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

  //create a new entry
  post = async (req, res) => {
    try {
      //Initializing the field
      info('Creating a new Rate category !');

      let dataToInsert = {
        'rateCategoryDetails': req.body.rateCategoryDetails,
        'noOfVehicles': req.body.noOfVehicles
      }
      //inserting data into the db
      let isInserted = await Model.create(dataToInsert);

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        //inserting the transporter and vehicle mapping
        if (req.body.vehicleDetails && Array.isArray(req.body.vehicleDetails) && req.body.vehicleDetails.length) {
          let transporterVehicleRateCategoryMapping = [];
          for (let data of req.body.vehicleDetails) {
            let vehicleData = {
              transporterId: data.transporterId,
              vehicleId: data.vehicleId,
              rateCategoryId: isInserted._id
            }
            transporterVehicleRateCategoryMapping.push(vehicleData);

          }
          //Inserting the mapping into the DB
          await rateTransporterVehicleMappingCtrl.create(transporterVehicleRateCategoryMapping);
        }

        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.rateCategoryCreated);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }


  // get ratecategory list 
  getList = async (req, res) => {
    try {
      info('Get the Rate Category List  !');
      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // get the list of asm in the allocated city
      let searchObject = {
        'isDeleted': 0,
      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'rateCategoryDetails.rateCategoryName': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'rateCategoryDetails.rateCategoryType': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // // get the total rate category
      let totalRateCategory = await Model.countDocuments({
        ...searchObject
      });

      // get the distributor list
      let rateCategoryList = await Model.aggregate([{
        '$match': {
          ...searchObject
        }
      },
      {
        '$sort': sortingArray
      }, {
        '$skip': skip
      }, {
        '$limit': pageSize
      },
      {
        $lookup: {
          from: 'ratecategorytransportervehiclemappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                // 'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$rateCategoryId', '$$id']
                }
              }
            }, {
              $project: {
                '_id': 1,
                'status': 1,
                'isDeleted': 1,
                'vehicleId': 1,
                'transporterId': 1
              }
            },
            {
              $lookup: {
                from: 'vehiclemasters',
                localField: "vehicleId",
                foreignField: "_id",
                as: 'vehicle'
              }

            },
            {
              $unwind: {
                path: '$vehicle',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'transporters',
                localField: "transporterId",
                foreignField: "_id",
                as: 'transporter'
              }
            },
            {
              $unwind: {
                path: '$transporter',
                preserveNullAndEmptyArrays: true
              }
            },
          ],
          as: 'transporterVehicleMapping'
        }
      },

      {
        $project: {
          'rateCategoryDetails': 1,
          // 'noOfVehicles': 1,
          'noOfVehicles': { $cond: { if: { $isArray: "$transporterVehicleMapping" }, then: { $size: "$transporterVehicleMapping" }, else: "NA" } },
          'status': 1,
          'isDeleted': 1,
          '_id': 1,
          'transporter.vehicleDetails.name': 1,
          'transporter._id': 1,
          'vehicle._id': 1,
          'transporterVehicleMapping._id': 1,
          'transporterVehicleMapping.status': 1,
          'transporterVehicleMapping.vehicle._id': 1,
          'transporterVehicleMapping.vehicle.vehicleType': 1,
          'transporterVehicleMapping.vehicle.vehicleModel': 1,
          'transporterVehicleMapping.vehicle.tonnage': 1,
          'transporterVehicleMapping.transporter._id': 1,
          'transporterVehicleMapping.transporter.vehicleDetails.name': 1,
        }
      },

      ]).allowDiskUse(true);


      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: rateCategoryList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalRateCategory
        }
      }, this.messageTypes.rateCategoryDetailsFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

  // get minfied ratecategory list 
  getListMinified = async (req, res) => {
    try {
      info('Get the Rate Category List  !');
      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // get the list of asm in the allocated city
      let searchObject = {
        'isDeleted': 0,
      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'rateCategoryDetails.rateCategoryName': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'rateCategoryDetails.rateCategoryType': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // // get the total rate category
      let totalRateCategory = await Model.countDocuments({
        ...searchObject
      });

      // get the distributor list
      let rateCategoryList = await Model.aggregate([{
        '$match': {
          ...searchObject
        }
      },
      {
        '$sort': sortingArray
      }, {
        '$skip': skip
      }, {
        '$limit': pageSize
      },
      {
        $project: {
          'rateCategoryName': '$rateCategoryDetails.rateCategoryName',
          // 'noOfVehicles': 1,
          // 'noOfVehicles': { $cond: { if: { $isArray: "$transporterVehicleMapping" }, then: { $size: "$transporterVehicleMapping" }, else: "NA" } },
          // 'status': 1,
          // 'isDeleted': 1,
          // '_id': 1,
          // 'transporter.vehicleDetails.name': 1,
          // 'transporter._id': 1,
          // 'vehicle._id': 1,
          // 'transporterVehicleMapping._id': 1,
          // 'transporterVehicleMapping.status': 1,
          // 'transporterVehicleMapping.vehicle._id': 1,
          // 'transporterVehicleMapping.vehicle.vehicleType': 1,
          // 'transporterVehicleMapping.vehicle.vehicleModel': 1,
          // 'transporterVehicleMapping.vehicle.tonnage': 1,
          // 'transporterVehicleMapping.transporter._id': 1,
          // 'transporterVehicleMapping.transporter.vehicleDetails.name': 1,
        }
      },

      ]).allowDiskUse(true);


      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: rateCategoryList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalRateCategory
        }
      }, this.messageTypes.rateCategoryDetailsFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

  // get details 
  getRateCategory = async (req, res) => {
    try {
      info('GET Rate Category DETAILS !');

      let rateCategoryData = await Model.aggregate([{
        $match: {
          _id: mongoose.Types.ObjectId(req.params.rateCategoryId)
        }
      },
      {
        $lookup: {
          from: 'ratecategorytransportervehiclemappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                // 'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$rateCategoryId', '$$id']
                }
              }
            }, {
              $project: {
                '_id': 1,
                'status': 1,
                'isDeleted': 1,
                'vehicleId': 1,
                'transporterId': 1
              }
            },
            {
              $lookup: {
                from: 'vehiclemasters',
                localField: "vehicleId",
                foreignField: "_id",
                as: 'vehicle'
              }

            },
            {
              $unwind: {
                path: '$vehicle',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'transporters',
                localField: "transporterId",
                foreignField: "_id",
                as: 'transporter'
              }
            },
            {
              $unwind: {
                path: '$transporter',
                preserveNullAndEmptyArrays: true
              }
            },
          ],
          as: 'transporterVehicleMapping'
        }
      },

      {
        $project: {
          //   'transporter': 1,
          //  'noOfVehicles': 1,
          'rateCategoryDetails': 1,
          'noOfVehicles': { $cond: { if: { $isArray: "$transporterVehicleMapping" }, then: { $size: "$transporterVehicleMapping" }, else: "NA" } },
          'status': 1,
          'isDeleted': 1,
          '_id': 1,
          'transporter.vehicleDetails.name': 1,
          'transporter._id': 1,
          'vehicle._id': 1,
          'transporterVehicleMapping._id': 1,
          'transporterVehicleMapping.status': 1,
          'transporterVehicleMapping.vehicle._id': 1,
          'transporterVehicleMapping.vehicle.vehicleType': 1,
          'transporterVehicleMapping.vehicle.vehicleModel': 1,
          'transporterVehicleMapping.vehicle.tonnage': 1,
          'transporterVehicleMapping.transporter._id': 1,
          'transporterVehicleMapping.transporter.vehicleDetails.name': 1,
        }
      },
      ]).allowDiskUse(true);


      // check if data is present or not 
      if (rateCategoryData && !_.isEmpty(rateCategoryData)) {
        return this.success(req, res, this.status.HTTP_OK, rateCategoryData, this.messageTypes.rateCategoryDetailsFetched);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryDetailsNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // patch the request 
  patchtRateCategory = async (req, res) => {
    try {
      let rateCategoryDetails = {},
        toChangeObject = req.body.toChangeObject || '',
        rateCategoryDataFromDb = req.body.rateCategoryDataFromDb || '';
      info('Rate Category CHANGE !');
      // creating data to insert

      rateCategoryDetails = {
        'rateCategoryName': toChangeObject.rateCategoryName ? toChangeObject.rateCategoryName : rateCategoryDataFromDb.rateCategoryName,
        'rateCategoryType': toChangeObject.rateCategoryType ? toChangeObject.rateCategoryType : rateCategoryDataFromDb.rateCategoryType,
        'fixedRentalAmount': toChangeObject.fixedRentalAmount ? toChangeObject.fixedRentalAmount : rateCategoryDataFromDb.fixedRentalAmount,
        'includedAmount': toChangeObject.includedAmount ? toChangeObject.includedAmount : rateCategoryDataFromDb.includedAmount,
        'includedDistance': toChangeObject.includedDistance ? toChangeObject.includedDistance : rateCategoryDataFromDb.includedDistance,
        'additionalAmount': toChangeObject.additionalAmount ? toChangeObject.additionalAmount : rateCategoryDataFromDb.additionalAmount
      }
      console.log('rateCategoryDetails', rateCategoryDetails);

      let dataToUpdate = {
        $set: {
          'rateCategoryDetails': rateCategoryDetails
        }
      };

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(req.params.rateCategoryId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      });
      console.log('isUpdated', isUpdated);

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.rateCategoryUpdatedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryNotUpdated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }



  deleteRateCategoryVehicleTranporterMapping = async (req, res) => {
    try {
      info('Rate category Vehicle Tranporter  Delete!');

      let rateCategoryVehicleTransporterMappingId = req.params.rateCategoryVehicleTransporterMappingId || '';


      let deleteMappingResult = await rateTransporterVehicleMappingCtrl.deleteMapping(rateCategoryVehicleTransporterMappingId);


      // check if updated 
      if (deleteMappingResult.success) return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.rateCategoryVehicleTransporterMappingDeletedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryVehicleTransporterMappingNotDeletedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }


  addRateCategoryVehicleTranporterMapping = async (req, res) => {
    try {
      info('Add Mapping of Rate category, Vehicle  and Tranporter  !');
      //initializing variable
      let transporterId = req.body.transporterId || '',
        vehicleId = req.body.vehicleId || '',
        rateCategoryId = req.params.rateCategoryId || '';

      // creating a mapping object
      let rateTransporterVehicleMappingObject = {
        vehicleId,
        transporterId,
        rateCategoryId
      }
      //creating mapping of transporter vehicle and rate category 
      let addMappingResult = await rateTransporterVehicleMappingCtrl.createSingle(rateTransporterVehicleMappingObject);

      // check if added 
      if (addMappingResult.success) return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.rateCategoryVehicleTransporterMappingAddedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryVehicleTransporterMappingNotAddedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

  deleteRateCategory = async (req, res) => {
    try {
      info('Rate category  Delete!');

      let rateCategoryId = req.params.rateCategoryId || '';

      // creating data to update
      let dataToUpdate = {
        $set: {
          status: 0,
          isDeleted: 1
        }
      };

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(rateCategoryId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      })

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.rateCategoryDeletedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.rateCategoryNotDeletedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

}


// exporting the modules 
module.exports = new rateCategoryController();
