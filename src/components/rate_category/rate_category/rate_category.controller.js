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
      // let totalRateCategory = await Model.countDocuments({
      //   ...searchObject
      // });

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
      }, {
        $project: {
          'rateCategoryDetails': 1,
          'noOfVehicles': 1,
          'status': 1,
        }
      }
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
        , {
        $lookup: {
          from: 'ratecategoryTransporterVehicleMapping',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$rateCategoryId', '$$id']
                }
              }
            }, {
              $project: {
                'status': 1,
                'isDeleted': 1,
                'vehicleId': 1,
                'transporterId': 1
              }
            }
          ],
          as: 'transporterVehicleMapping'
        }
      },
      {
        $lookup: {
          from: 'vehicleMaster',
          localField: "transporterVehicleMapping.vehicleId",
          foreignField: "_id",
          as: 'vehicle'
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

      info('Transporter CHANGE ! !');
      // creating data to insert
      let dataToUpdate = {
        $set: {
          ...req.body,
        }
      };

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(req.params.ratecategoryId)
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



  deleteRateCategoryVehicleTranporterMapping = async (req, res) => {
    try {
      info('Rate category Vehicle Tranporter  Delete!');
      let mappingIdData = {
        'rateCategoryId': req.params.rateCategoryId || '',
        'transporterId': req.body.transporterId || '',
        'vehicleId': req.body.vehicleId || ''
      }

      let deleteMappingResult = rateTransporterVehicleMappingCtrl.deleteMapping(mappingIdData);


      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, {});
      else return this.errors(req, res, this.status.HTTP_CONFLICT);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

}


// exporting the modules 
module.exports = new rateCategoryController();
