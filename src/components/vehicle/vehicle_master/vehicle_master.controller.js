const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const rateTransporterVehicleMappingCtrl = require('../../rate_category/ratecategory_transporter_vehicle_mapping/ratecategory_transporter_vehicle_mapping.controller');
const Model = require('./models/vehicle_master.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;


// getting the model 
class vehicleController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.vehicle;
  }

  // create a new entry
  post = async (req, res) => {
    try {
      info('Vehicle Create Controller !');

      //initializing variable
      let transporterId = req.body.transporterId || '',
        rateCategoryId = req.body.rateCategoryId || '';

      // creating data to insert
      let dataToInsert = {
        'regNumber': req.body.regNumber,
        'vehicleType': req.body.vehicleType,
        'vehicleModel': req.body.vehicleModel,
        'height': req.body.height,
        'length': req.body.length,
        'breadth': req.body.breadth,
        'tonnage': req.body.tonnage
      }

      // inserting data into the db 
      let isInserted = await Model.create(dataToInsert);

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {

        let rateTransporterVehicleMappingObject = {
          vehicleId: isInserted._id,
          transporterId,
          rateCategoryId
        }
        //creating mapping of transporter vehicle and rate category 
        await rateTransporterVehicleMappingCtrl.createSingle(rateTransporterVehicleMappingObject);
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.vehicleCreated);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.vehicleNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // get Vehicle list 
  getVehicleList = async (req, res) => {
    try {
      info('Get the Vehicle List !');

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
            'regNumber': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'vehicleModel': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // // get the total rate category
      let totalVehicle = await Model.countDocuments({
        ...searchObject
      });


      // get the Vehicle list 
      let vehicleList = await Model.aggregate([{
        '$match': {
          ...searchObject
        }
      }, {
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
                  '$eq': ['$vehicleId', '$$id']
                }
              }
            }, {
              $project: {
                '_id': 1,
                'status': 1,
                'isDeleted': 1,
                'vehicleId': 1,
                'transporterId': 1,
                'rateCategoryId': 1
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
            {
              $lookup: {
                from: 'ratecategorymodels',
                localField: "rateCategoryId",
                foreignField: "_id",
                as: 'rateCategory'
              }
            },
            {
              $unwind: {
                path: '$rateCategory',
                preserveNullAndEmptyArrays: true
              }
            },
          ],
          as: 'transporterRateCategoryDetails'
        }
      },
      {
        $unwind: {
          path: '$transporterRateCategoryDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          '_id': 1,
          'regNumber': 1,
          'vehicleType': 1,
          'vehicleModel': 1,
          'height': 1,
          'length': 1,
          'breadth': 1,
          'tonnage': 1,
          'status': 1,
          'rateCategoryId': '$transporterRateCategoryDetails.rateCategory._id',
          'rateCategoryName': '$transporterRateCategoryDetails.rateCategory.rateCategoryDetails.rateCategoryName',

          'transporterId': '$transporterRateCategoryDetails.transporter._id',
          'transporterName': '$transporterRateCategoryDetails.transporter.vehicleDetails.name',
        }
      },
      ]).allowDiskUse(true);

      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: vehicleList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalVehicle
        }
      }
        // this.messageTypes.transporterFetched
      );

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
  // get the minified list 
  getListMinified = async (req, res) => {
    try {
      info('Get Minified List of Vehicle !');
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // project data 
      let dataToProject = {
        _id: 1,
        vehicleModel: 1,
      }

      // get the list of asm in the allocated city
      let searchObject = {
        'isDeleted': 0,
        'status': 1
      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'vehicleModel': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // get the total vehicle
      let totalVehicle = await Model.countDocuments({
        ...searchObject
      });

      // get the vehicle list
      let vehicleList = await Model.aggregate([{
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
        $project: dataToProject
      }]).allowDiskUse(true);

      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: vehicleList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalVehicle
        }
      }, this.messageTypes.vehicleDetailsFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // // get details 
  getDetails = async (req, res) => {
    try {
      info('Vehicle GET DETAILS !');

      // get the brand id 
      let vehicleId = req.params.vehicleId;

      let vehicleData = await Model.aggregate([{
        '$match': {
          '_id': mongoose.Types.ObjectId(vehicleId),
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
                  '$eq': ['$vehicleId', '$$id']
                }
              }
            }, {
              $project: {
                '_id': 1,
                'status': 1,
                'isDeleted': 1,
                'vehicleId': 1,
                'transporterId': 1,
                'rateCategoryId': 1
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
            {
              $lookup: {
                from: 'ratecategorymodels',
                localField: "rateCategoryId",
                foreignField: "_id",
                as: 'rateCategory'
              }
            },
            {
              $unwind: {
                path: '$rateCategory',
                preserveNullAndEmptyArrays: true
              }
            },
          ],
          as: 'transporterRateCategoryDetails'
        }
      },
      {
        $unwind: {
          path: '$transporterRateCategoryDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          '_id': 1,
          'regNumber': 1,
          'vehicleType': 1,
          'vehicleModel': 1,
          'height': 1,
          'length': 1,
          'breadth': 1,
          'tonnage': 1,
          'status': 1,
          'rateCategoryId': '$transporterRateCategoryDetails.rateCategory._id',
          'rateCategoryName': '$transporterRateCategoryDetails.rateCategory.rateCategoryDetails.rateCategoryName',

          'transporterId': '$transporterRateCategoryDetails.transporter._id',
          'transporterName': '$transporterRateCategoryDetails.transporter.vehicleDetails.name',
        }
      },
      ]).allowDiskUse(true);

      // check if data is present
      if (vehicleData && !_.isEmpty(vehicleData)) return this.success(req, res, this.status.HTTP_OK, vehicleData, this.messageTypes.vehicleDetailsFetched);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.vehicleNotFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // patch the request 
  patchVehicle = async (req, res) => {
    try {
      info('Vehicle STATUS CHANGE !');

      // inserting the new user into the db
      let isUpdated = await Model.update({
        _id: mongoose.Types.ObjectId(req.params.vehicleid),
      }, {
        $set: {
          ...req.body
        }
      })
      // is inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) {
        // success response 
        isUpdated.password = undefined;
        return this.success(req, res, this.status.HTTP_OK, req.body);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  //Delete Transporter

  deleteVehicle = async (req, res) => {
    try {
      info('Vehicle Delete!');

      // asm id  
      let vehicleId = req.params.vehicleId;

      // creating data to insert
      let dataToUpdate = {
        $set: {
          status: 0,
          isDeleted: 1
        }
      };

      // deleting distributor  data into the db
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(vehicleId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      })

      // is updated 
      if (isUpdated && !_.isEmpty(isUpdated)) {
        // success response 
        return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.VehicleDeleted);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.VehicleNotDeleted);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

}


// exporting the modules 
module.exports = new vehicleController();