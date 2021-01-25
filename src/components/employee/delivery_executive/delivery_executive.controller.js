const moment = require("moment");
const BasicCtrl = require("../../basic_config/basic_config.controller");
const BaseController = require("../../baseController");
const Model = require("./models/delivery_executive.model");
const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../utils").logging;

// getting the model
class deliveryExecutiveCtrl extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.employee;
  }

  // get details of picker
  getDeliveryDetails = async (deliveryId) => {
    try {
      info('Get delivery details !');

      // find the picker
      // get details 
      return Model.aggregate([{
        $match: {
          '_id': mongoose.Types.ObjectId(deliveryId),
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
          error('Error Searching Data in Delivery executive DB!');
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

  // get details of delivery executive
  getDetails = async (employeeId) => {
    try {
      info('Get delivery executive details !');

      // find the delivery executive and get details
      return Model.aggregate([{
        $match: {
          '_id': mongoose.Types.ObjectId(employeeId),
          // 'isDeleted': 0
        }
      }
      ]).allowDiskUse(true).then((res) => {
        if (res && res.length) {
          return {
            success: true,
            data: res[res.length - 1]
          }
        } else {
          error('Error Searching Data in delivery executive DB!');
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
      return {
        success: false,
        error: err
      }
    }
  }
  // getting the Delivery Executive details using other fields
  getDetailsDeliveryUsingField = async (fieldValue) => {
    try {
      info("Get Delivery Executive details !");

      // find the  Delivery Executive
      return await Model.aggregate([
        {
          $match: {
            $or: [
              {
                email: fieldValue,
              },
              {
                contactMobile: fieldValue,
              },
            ],
            status: 1,
            isDeleted: 0,
          },
        },
      ])
        .allowDiskUse(true)
        .then((res) => {
          if (res && res.length) {
            return {
              success: true,
              data: res[res.length - 1],
            };
          } else {
            error("Error Searching Data in Delivery Executive DB!");
            return {
              success: false,
            };
          }
        })
        .catch((err) => {
          error(err);
          return {
            success: false,
            error: err,
          };
        });

      // catch any runtime error
    } catch (err) {
      error(err);
    }
  };


  // Internal Function get full details 
  getdeliveryFullDetails = async (deliveryId) => {
    try {
      info('Delivery GET DETAILS !');

      // get picker boy details
      let deliveryData = await Model.aggregate([{
        $match: {
          _id: mongoose.Types.ObjectId(deliveryId)
        }
      }
      ]).allowDiskUse(true);

      // check if inserted 
      if (deliveryData && deliveryData.length) return {
        success: true,
        data: deliveryData[deliveryData.length - 1]
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


  // Internal function to update the details
  updateDetails = async (dataObject, id) => {
    try {
      info('Update Delivery Executive details Internal Function !');

      // creating data to insert
      let dataToUpdate = {
        $set: {
          ...dataObject
        }
      };

      return Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(id)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      }).then((res) => {
        if (res) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Updating Data in Delivery Executive DB!');
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

  // internal create function
  create = async (dataToInsert) => {
    try {
      info('Create a new Delivery Executive !');

      // inserting data into the db 
      return Model.create(dataToInsert)
        .then((res) => {
          // check if inserted 
          if (res && !_.isEmpty(res))
            return {
              success: true,
              data: res
            };
          else return {
            success: false,
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



  get = async (req, res) => {
    try {
      info("Employee GET DETAILS !");
      // get the brand id
      let employeeId = req.params.employeeId;
      // inserting data into the db
      // let transporter = await Model.findOne({
      // let employee = await Model.findById({

      //   _id: mongoose.Types.ObjectId(employeeId)

      // }).lean();

      let employee = await Model.findOne({
        _id: mongoose.Types.ObjectId(req.params.employeeId),
        isDeleted: 0,
      }).lean();

      // check if inserted
      if (employee && !_.isEmpty(employee))
        return this.success(req, res, this.status.HTTP_OK, employee, this.messageTypes.deliveryExecutiveFetchedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.deliveryExecutiveNotFound);

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };



  // get  Delivery Executive list 
  getList = async (req, res) => {
    try {
      info('Get the Delivery Executive !');

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
            'employeeId': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'employerName': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // get the total delivery executive
      let totalDeliveryExecutive = await Model.countDocuments({
        ...searchObject
      });


      // get the Transporter list 
      let deliveryExecutiveList = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      }, {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
      },
      ])

      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: deliveryExecutiveList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalDeliveryExecutive
        }
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // patch the request
  updateDeliveryExecutiveDetails = async (employeeId, body) => {
    try {
      info("Delivery Executive Employee Update !");

      // creating data to insert
      let dataToUpdate = {
        $set: {
          ...body,
        },
      };

      // inserting data into the db
      let isUpdated = await Model.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(employeeId),
        },
        dataToUpdate,
        {
          new: true,
          upsert: false,
          lean: true,
        }
      );

      // check if updated
      if (isUpdated && !_.isEmpty(isUpdated)) {
        return {
          success: true,
          data: isUpdated
        }
      }
      else return {
        success: false
      }
      // catch any runtime error
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  };

  //delete Employee
  deleteEmployee = async (req, res) => {
    try {
      info("Employee Delete!");
      //let employeeId = req.query.employeeId;
      // inserting the new user into the db
      let employeeId = req.params.employeeId || "";

      // creating data to update
      let dataToUpdate = {
        $set: {
          // status: 0,
          isDeleted: 1
        }
      };

      // inserting data into the db 
      //   let isUpdated = await Model.findOneAndUpdate({
      let isUpdated = await Model.updateOne({
        _id: mongoose.Types.ObjectId(employeeId)
      },
        dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      }
      )

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.deliveryExecutiveDeletedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.deliveryExecutiveNotDeletedSuccessfully);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // patch Delivery Executive status
  patchDeliveryExecutiveStatus = async (type, employeeId) => {
    try {
      info('Delivery Executive STATUS CHANGE !');

      // type id 
      //  let type = req.params.type,
      //  employeeId = req.params.employeeId;

      // creating data to insert
      let dataToUpdate = {
        $set: {
          status: type == 'activate' ? 1 : 0
        }
      };

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(employeeId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      });

      // check if updated 
      if (isUpdated && !_.isEmpty(isUpdated))
        return {
          success: true,
          data: isUpdated
        }
      else return {
        success: false,
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }
}

// exporting the modules
module.exports = new deliveryExecutiveCtrl();
