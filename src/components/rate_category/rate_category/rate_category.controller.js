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
    console.log("dsadasdaffafdsgsdgsfGFFHDNDFNDnN");
    try {
      info('Get the Cost Element List  !');
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
            'rateCategory': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'rateCategoryType': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // get the total cost Element
      let totalcostElement = await Model.countDocuments({
        ...searchObject
      });

      // get the distributor list
      let costElementList = await Model.aggregate([{
        '$sort': sortingArray
      }, {
        '$match': {
          ...searchObject
        }
      }, {
        '$skip': skip
      }, {
        '$limit': pageSize
      }])


      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: costElementList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalcostElement
        }
      },
        //this.messageTypes.costElementsDetailsFetched
      );

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

  // get details 
  getRateCategory = async (req, res) => {
    try {
      info('RateCategory GET DETAILS !');

      // inserting data into the db 
      // let transporter = await Model.findOne({
      let rateCategory = await Model.findById({

        _id: mongoose.Types.ObjectId(req.params.ratecategoryId)
      }).lean();

      // check if inserted 
      if (rateCategory && !_.isEmpty(rateCategory)) return this.success(req, res, this.status.HTTP_OK, rateCategory);
      else return this.errors(req, res, this.status.HTTP_CONFLICT);

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



  deleteRateCategory = async (req, res) => {
    try {
      info('New Vehicle Delete!');

      // inserting the new user into the db
      let isUpdated = await Model.findByIdAndDelete({
        _id: mongoose.Types.ObjectId(req.params.ratecategoryId),
      }, {
        $set: {
          ...req.body
        }
      })

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
