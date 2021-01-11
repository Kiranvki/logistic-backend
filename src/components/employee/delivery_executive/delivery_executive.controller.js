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
      console.log("Emplloyy", employee);
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




  // // // patch the request
  updateDeliveryExecutiveDetails = async (req, res) => {
    try {
      info("Employee CHANGE ! !");

      // creating data to insert
      let dataToUpdate = {
        $set: {
          ...req.body,
        },
      };

      // inserting data into the db
      let isUpdated = await Model.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.params.employeeId),
        },
        dataToUpdate,
        {
          new: true,
          upsert: false,
          lean: true,
        }
      );

      // check if inserted
      if (isUpdated && !_.isEmpty(isUpdated))
        return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.deliveryExecutiveUpdatedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.deliveryExecutiveNotUpdatedSuccessfully);

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
}

// exporting the modules
module.exports = new deliveryExecutiveCtrl();
