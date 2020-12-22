const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/transporter.model')
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

class transporterController extends BaseController {
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
      info('Creating Transporter !');

      // inserting data into the db 
      let isInserted = await Model.create({
        ...req.body
      });

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.transporterCreated);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotCreated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // get transporter list 
  getList = async (req, res) => {
    try {
      info('Get the Transporter List !');

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
            'vehicleDetails.name': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'locationDetails.address': {
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
      },
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

  // get transporter minified list 
  getMinifiedList = async (req, res) => {
  try {
    info('Get the transporter List  !');
    // get the query params
    let page = req.query.page || 1,
      pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
      searchKey = req.query.search || '',
      sortBy = req.query.sortBy || 'createdAt',
      sortingArray = {};

    sortingArray[sortBy] = -1;
    let skip = parseInt(page - 1) * pageSize;
    let fieldsToProject = {
      'vehicleDetails.name':1,
      //'transporterId':1,
       // 'transporter._id':1,
      '_id':1
    }


    // get the list of asm in the allocated city
    let searchObject = {
      'isDeleted': 0,
    };

    // creating a match object
    if (searchKey !== '')
      searchObject = {
        ...searchObject,
        '$or': [{
          'vehicleDetails.name': {
            $regex: searchKey,
            $options: 'is'
          }
        }]
      };

    // get the total rate category
    let totaltransporter = await Model.countDocuments({
      ...searchObject
    });

    // get the distributor list
    let transporterList = await Model.aggregate([{
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
      $project: fieldsToProject
    },
    ]).allowDiskUse(true);


    // success 
    return this.success(req, res, this.status.HTTP_OK, {
      results: transporterList,
      pageMeta: {
        skip: parseInt(skip),
        pageSize: pageSize,
        total: totaltransporter
      }
    }, this.messageTypes.transporterFetched);

    // catch any runtime error 
  } catch (err) {
    error(err);
    this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  }

}


 // Internal function check id is valid 
 isValidId = async (transporterId) => {
  try {
    info('Checking whether the Warehouse Id exists or not !');

    // creating a search object 
    let searchObject = {
      '_id': mongoose.Types.ObjectId(transporterId),
      'isDeleted': 0,
    };

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

    // catch any runtime error 
  } catch (err) {
    error(err);
    return {
      success: false,
      error: err
    }
  }
}
  
  // get details 
  getTransporter = async (req, res) => {

    try {
      info('Transporter GET DETAILS !');
      // get the brand id 
      let transporterId = req.params.transporterId;
      // inserting data into the db 
      // let transporter = await Model.findOne({
      let transporter = await Model.findById({

        _id: mongoose.Types.ObjectId(transporterId)
      }).lean();

      // check if inserted 
      if (transporter && !_.isEmpty(transporter)) return this.success(req, res, this.status.HTTP_OK, transporter, this.messageTypes.transporterFetched);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // // patch the request 
  patchTransporter = async (req, res) => {
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
        _id: mongoose.Types.ObjectId(req.params.transporterId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      });

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.transporterUpdated);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotUpdated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  //Delete Transporter

  deleteTransporter = async (req, res) => {
    try {
      info('New Vehicle Delete!');

      // inserting the new user into the db
      let isUpdated = await Model.findByIdAndDelete({
        _id: mongoose.Types.ObjectId(req.params.transporterId),
      }, {
        $set: {
          ...req.body
        }
      })

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.transporterDeleted);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotDeleted);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

}
// exporting the modules 
module.exports = new transporterController();