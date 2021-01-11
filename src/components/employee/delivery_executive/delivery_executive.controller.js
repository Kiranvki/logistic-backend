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
  create = async (req, res) => {
    try {
      info('Create a new Picker Boy !');

      // getting the full name 
      let fullName = `${req.body.firstName} ${req.body.lastName}`;

      // creating data to insert
      let dataToInsert = {
        ...req.body.userData,
        'firstName': req.body.firstName ? req.body.firstName : req.body.userData.firstName,
        'lastName': req.body.lastName ? req.body.lastName : req.body.userData.lastName,
        'isWaycoolEmp': req.body.isWaycoolEmp == true ? 1 : 0,
        'employerName': req.body.isWaycoolEmp == true ? 'Waycool Foods & Products Private Limited' : req.body.agencyName,
        'agencyId': req.body.isWaycoolEmp == true ? null : req.body.agencyId,
        'contactMobile': req.body.contactMobile,
        'email': req.body.email,
        'gender': req.body.isWaycoolEmp == true ? (req.body.userData.gender).toLowerCase() : (req.body.gender).toLowerCase(),
        'fullName': fullName,
        'cityId': req.body.cityId,
      }

      // checking if profile pic is present 
      if (req.body.profilePic)
        dataToInsert = {
          ...dataToInsert,
          'profilePic': req.body.profilePic
        }

      // if its not a waycool emp
      if (req.body.isWaycoolEmp == false)
        dataToInsert = {
          ...dataToInsert,
          'employeeId': req.body.empId,
          'firstName': req.body.firstName,
          'lastName': req.body.lastName,
          'photo': req.body.profilePic,
        }

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
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

<<<<<<< HEAD
// Get single list
=======
>>>>>>> d21e31f888bc0b9755a0200ca92ceae329af88c6
  get = async (req, res) => {
    try {
      info("Employee GET DETAILS !");
      // get the brand id
      let employeeId = req.params.employeeId;
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

<<<<<<< HEAD
  // get  Delivery Executive list 
=======


  // get transporter list 
>>>>>>> d21e31f888bc0b9755a0200ca92ceae329af88c6
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

      // get the total rate category
      let totalTransporter = await Model.countDocuments({
        ...searchObject
      });


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
          total: totalTransporter
        }
      }, );

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

<<<<<<< HEAD
  // patch the request
=======

  

  // // // patch the request
>>>>>>> d21e31f888bc0b9755a0200ca92ceae329af88c6
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


     // patch Delivery Executive status
    //  patchDeliveryExecutiveStatus = async (req, res) => {
    //   try {
    //     info('Delivery Executive STATUS CHANGE !');
  
    //     // type id 
    //     let type = req.params.type,
    //     deliveryexecutiveId = req.params.deliveryexecutiveId;
    //     // creating data to insert
    //     let dataToUpdate = {
    //       $set: {
    //         status: type == 'activate' ? 1 : 0
    //       }
    //     };
  
    //     // inserting data into the db 
    //     let isUpdated = await Model.findOneAndUpdate({
    //       _id: mongoose.Types.ObjectId(deliveryexecutiveId)
    //     }, dataToUpdate, {
    //       new: true,
    //       upsert: false,
    //       lean: true
    //     });
    //     // check if inserted 
    //     if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, type == 'activate' ? this.messageTypes.deliveryExecutiveActivatedSuccessfully : this.messageTypes.deliveryExecutiveDeactivatedSuccessfully);
    //     else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.deliveryExecutiveNotUpdatedSuccessfully);
  
    //     // catch any runtime error 
    //   } catch (err) {
    //     error(err);
    //     this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    //   }
    // }

    // patchDeliveryExecutiveStatus = async (req, res) => {
    //   try {
    //     info('Transporter STATUS CHANGE !');
  
    //     // type id 
    //     let type = req.params.type,
    //     deliveryId = req.params.deliveryId;
    //    // getemployee = req.params.employeeType
    //     //if (employeeType == "deliveryexecutive") {
    //     // creating data to insert
    //     let dataToUpdate = {
    //       $set: {
    //         status: type == 'activate' ? 1 : 0
    //       }
    //     };
  
    //     // inserting data into the db 
    //     let isUpdated = await Model.findOneAndUpdate({
    //       _id: mongoose.Types.ObjectId(deliveryId)
    //     }, dataToUpdate, {
    //       new: true,
    //       upsert: false,
    //       lean: true
    //     });
  
    //     // check if inserted 
    //        if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, type == 'activate' ? this.messageTypes.deliveryExecutiveActivatedSuccessfully : this.messageTypes.deliveryExecutiveDeactivatedSuccessfully);
    //     else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.deliveryExecutiveNotUpdatedSuccessfully);
  
    //     // catch any runtime error 
    //   //}
    //  } catch (err) {
    //     error(err);
    //     this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    //   }
    // }
}

// exporting the modules
module.exports = new deliveryExecutiveCtrl();
