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
    this.messageTypes = this.messageTypes.vehicleMaster;
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
  getVehicle = async (req, res) => {
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

      // project data 
      // let dataToProject = {
      //   firstName: 1,
      //   lastName: 1,
      //   employeeId: 1,
      //   status: 1,
      //   reportingTo: 1
      // }

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
            'vehicleType': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };



      // get the Vehicle list 
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
        // },
        // {
        //   $project: {

        //     'name': 1,
        //     'isDeleted': 1
        //   }
      }
      ])
      //.allowDiskUse(true);

      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: vehicleList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          // total: totalAsms
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


  // // get details 
  getList = async (req, res) => {
    try {
      info('Vehicle GET DETAILS !');

      // inserting data into the db 
      // let transporter = await Model.findOne({
      let vehicle = await Model.findById({

        _id: mongoose.Types.ObjectId(req.params.vehicleid)
      }).lean();

      // check if inserted 
      if (vehicle && !_.isEmpty(vehicle)) return this.success(req, res, this.status.HTTP_OK, vehicle);
      else return this.errors(req, res, this.status.HTTP_CONFLICT);

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

  deleterVehicle = async (req, res) => {
    try {
      info('New Vehicle Delete!');

      // inserting the new user into the db
      let isUpdated = await Model.findByIdAndDelete({
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

}


// exporting the modules 
module.exports = new vehicleController();