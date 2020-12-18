const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/transporter_rate_mapping.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

// getting the model 
class transporterRateMappingCtrl extends BaseController {
    // constructor 
    constructor() {
      super();
      this.messageTypes = this.messageTypes.transporterMaster;
    }

    
  // create a new entry
  post = async (req, res) => {
    try {
      //Initializing the field
      //let TransporterMasterResult;
      info('Transporter Ratecategory Controller !');

      // inserting data into the db 
      let isInserted = await Model.create({
        ...req.body
      });

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.transporterRatecategory);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterRatecateNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

   // get transporter list 
   getList = async (req, res) => {
    try {
      info('Get the Roles List !');

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
            'transporterId': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'rateCategoryModel': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };



      // get the Transporter list 
      let transporterList = await Model.aggregate([{
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
        results: transporterList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          // total: totalAsms
        }
      }, this.messageTypes.transporterFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

}

// exporting the modules 
module.exports = new transporterRateMappingCtrl();