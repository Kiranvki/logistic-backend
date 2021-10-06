const BasicCtrl = require('../../basic_config/basic_config.controller');

const mongoose = require('mongoose'); // mongoose
const BaseController = require('../../baseController');
const Model = require('./models/warehouse.model');
const camelCase = require('camelcase');
const {
  error,
  info
} = require('../../../utils').logging;
const _ = require('lodash');

// getting the model 
class userController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.assests;
  }

  // do something 
  isNameExists = async (name, city) => {
    try {
      info('Checking whether the name is unique or not  !');

      // find the data 
      return Model.findOne({
        'name': name,
        'cityId': city,
        'isDeleted': 0
      }).lean().then((data) => {
        if (!_.isEmpty(data)) {
          return {
            success: true,
            data: data
          }
        } else return {
          success: false
        }
      }).catch((err) => {
        return {
          success: false,
          error: err
        };
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // is warehouse exists
  isExist = async (warehouseId) => {
    try {
      info('Checking whether the warehouse is unique or not  !');

      // find the data 
      return Model.findOne({
        '_id': mongoose.Types.ObjectId(warehouseId),
        'isDeleted': 0
      }).lean().then((data) => {
        if (!_.isEmpty(data)) {
          return {
            success: true,
            data: data
          }
        } else return {
          success: false
        }
      }).catch((err) => {
        return {
          success: false,
          error: err
        };
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // login authentication
  create = async (req, res) => {
    try {
      info('Generating a new auth token !');

      let isCreated = await Model.create({
        name: req.body.camelCase,
        nameToDisplay: req.body.name,
        cityId: req.body.city,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        location: {
          type: 'Point',
          coordinates: [!isNaN(req.body.longitude) ? req.body.longitude : null, !isNaN(req.body.latitude) ? req.body.latitude : null]
        },
        street: (req.body.street).toLowerCase(),
        pincode: req.body.pincode
      })

      // is inserted 
      return this.success(req, res, this.status.HTTP_OK, isCreated, this.messageTypes.create);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // patch warehouse list
  patch = async (req, res) => {
    try {
      info('Updating Warehouse Ids !');
      // get the warehouse id 
      let warehouseId = req.params.warehouseId;

      // update the model
      let isCreated = await Model.findByIdAndUpdate(warehouseId, {
        name: req.body.camelCase,
        nameToDisplay: req.body.name,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        location: {
          type: 'Point',
          coordinates: [!isNaN(req.body.longitude) ? req.body.longitude : null, !isNaN(req.body.latitude) ? req.body.latitude : null]
        },
        street: (req.body.street).toLowerCase(),
        pincode: req.body.pincode,
        locationId: req.body.locationId
      }, {
        'upsert': false,
        'new': true
      })

      // is inserted 
      return this.success(req, res, this.status.HTTP_OK, isCreated, this.messageTypes.updated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get the list 
  getList = async (req, res) => {
    try {
      info('Get the list of agencies !');

      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {},
        cityId = req.user.region[0] || 'chennai';

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // get the list of asm in the allocated city
      let searchObject = {
        'isDeleted': 0,
        'cityId': cityId
      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'name': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'nameToDisplay': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // get the total customer
      let totalAgencies = await Model.countDocuments({
        ...searchObject
      });

      // get the asms list
      let agencyList = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      }, {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
      }]).allowDiskUse(true);

      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: agencyList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalAgencies
        }
      }, this.messageTypes.agencyListedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // check whether the agency id is valid or not 
  isValid = async (agencyId) => {
    try {
      info('Checking whether the agency id is valid or not  !');
      const ObjectId = mongoose.Types.ObjectId;

      if (ObjectId.isValid(agencyId)) {
        // find the data 
        return Model.findOne({
          '_id': mongoose.Types.ObjectId(agencyId),
          'isDeleted': 0
        }).lean().then((data) => {
          if (!_.isEmpty(data)) {
            return {
              success: true,
              data: data
            }
          } else return {
            success: false
          }
        }).catch((err) => {
          return {
            success: false,
            error: err
          };
        });
      } else {
        return {
          success: false
        }
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // update location ids 
  updateLocationIds = async (req, res) => {
    try {
      info('Updating Warehouse Location Ids !');
      let updatedWarehouse = [];

      // updating the location ids
      for (let i = 0; i < req.body.length; i++) {
        // update the model
        let isUpdated = await Model.findOneAndUpdate({
          name: req.body[i].name
        }, {
          locationId: req.body[i].locationId
        }, {
          'upsert': false,
          'new': true
        });

        // pushing the response to result
        updatedWarehouse.push(isUpdated);
      }

      // is inserted 
      return this.success(req, res, this.status.HTTP_OK, updatedWarehouse, this.messageTypes.updated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
  get =async(plant_id)=>{
    try {
      info('Get Warehouse  !');

      // get warehouse
    let plantDetails = await Model.findOne({_id:plant_id}).lean()

      // is inserted 
    return plantDetails;
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


getName =async(plant)=>{
  try {
    info('Get Warehouse  !');

    // get warehouse
  let plantDetails = await Model.findOne({'plant':plant,'status':1,'isDeleted':0},'nameToDisplay').lean()

    // is inserted 
  return plantDetails['nameToDisplay']?plantDetails['nameToDisplay']:'N/A';
    // catch any runtime error 
  } catch (err) {
    error(err);
    this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  }
}
}

// exporting the modules 
module.exports = new userController();
