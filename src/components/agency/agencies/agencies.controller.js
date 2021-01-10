const BasicCtrl = require('../../basic_config/basic_config.controller');

const mongoose = require('mongoose'); // mongoose
const BaseController = require('../../baseController');
const Model = require('./models/agencies.model');
const camelCase = require('camelcase');
const {
  error,
  info
} = require('../../../utils').logging;
const _ = require('lodash');
const {
  createNewAgencyForPickerAndDeliveryExecutive, //create a new agency for the delivery and pickerboy
  getAgencyListForDeliveryAnPickerBoy, // getting the agency list for pickerboy and delivery executive
} = require('../../../inter_service_api/dms_dashboard_v1/v1');

// getting the model 
class userController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.agencies;
  }

  // do something 
  isNameExists = async (name) => {
    try {
      info('Checking whether the name is unique or not  !');

      // find the data 
      return Model.findOne({
        'name': name,
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

      let name = req.body.name || '',// get the agency id 
        camelCaseName = req.body.camelCase,
        designation = req.params.designation || '',
        cityId = req.user.region || '';


      //checking whether the designation name is securityGuard
      if (designation && designation == 'securityGuard') {
        let isCreated = await Model.create({
          name: camelCaseName,
          nameToDisplay: name,
          cityId: req.user.region
        })

        // is inserted 
        return this.success(req, res, this.status.HTTP_OK, isCreated, this.messageTypes.create);

        //condition if the designation is pickerBoy or deliveryExecutive
      } else {

        //calling the micro service from dms v1
        let createNewAgencyResponse = await createNewAgencyForPickerAndDeliveryExecutive(name, cityId);
        if (createNewAgencyResponse.success) {
          info('New Agency for Delivery or PickerBoy created !'); // route doesnt exist 
          return this.success(req, res, this.status.HTTP_OK, createNewAgencyResponse.data, this.messageTypes.create)
        } else {
          error('Error creating agency for Delivery or PickerBoy')
          return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToCreateAgency);

        }
      }
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
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 10; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {},
        cityId = req.user.region || 'chennai',
        designation = req.params.designation;
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      //checking the designation
      if (designation && designation == 'securityGuard') {

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
      }
      //if the designation is either pickerboy or delivery executive 
      else {
        let agencyListForPickerAndDeliveryResponse = await getAgencyListForDeliveryAnPickerBoy(cityId, page, searchKey);

        console.log('agencyListForPickerAndDeliveryResponse.data', agencyListForPickerAndDeliveryResponse.data);
        if (agencyListForPickerAndDeliveryResponse.success) {
          //   success
          return this.success(req, res, this.status.HTTP_OK, {
            results: agencyListForPickerAndDeliveryResponse.data.results,
            pageMeta: {
              skip: parseInt(skip),
              pageSize: agencyListForPickerAndDeliveryResponse.data.pageMeta.pageSize,
              total: agencyListForPickerAndDeliveryResponse.data.pageMeta.total
            }
          }, this.messageTypes.agencyListedSuccessfully);
        } else {

          error('Error getting agency for Delivery or PickerBoy')
          return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchAgency);

        }
      }


      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get the list 
  getDeliveryAndPickerAgencyList = async (req, res) => {
    try {
      info('Get the list of agencies !');

      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {},
        cityId = req.user.region || 'chennai';

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
}

// exporting the modules 
module.exports = new userController();
