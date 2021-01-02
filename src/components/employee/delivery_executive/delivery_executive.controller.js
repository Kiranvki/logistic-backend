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
    this.messageTypes = this.messageTypes.deliveryExecutive;
  }

  // internal create function

  create = async (req, res) => {
    try {
      info("Creating Delivery Executive !");
      //let fullName = `${req.body.firstName} ${req.body.lastName}`;

      // creating data to insert
      let dataToInsert = {
        ...req.body.userData,
        firstName: req.body.firstName
          ? req.body.firstName
          : req.body.userData.firstName,
        lastName: req.body.lastName
          ? req.body.lastName
          : req.body.userData.lastName,
        isWaycoolEmp: req.body.isWaycoolEmp == true ? 1 : 0,
        employerName:
          req.body.isWaycoolEmp == true
            ? "Waycool Foods & Products Private Limited"
            : req.body.agencyName,
        //'agencyId': req.body.isWaycoolEmp == true ? null : req.body.agencyId,
        contactMobile: req.body.contactMobile,
        email: req.body.email,
        gender:
          req.body.isWaycoolEmp == true
            ? req.body.userData.gender.toLowerCase()
            : req.body.gender.toLowerCase(),
        // fullName: fullName,
        // 'createdById': req.user._id,
        // 'createdBy': req.user.email || 'admin',
        // 'warehouseId': mongoose.Types.ObjectId(req.user.warehouseId) || null,
        cityId: req.body.cityId,
      };

      // checking if profile pic is present
      if (req.body.profilePic)
        dataToInsert = {
          ...dataToInsert,
          profilePic: req.body.profilePic,
        };

      // if its not a waycool emp
      if (req.body.isWaycoolEmp == false)
        dataToInsert = {
          ...dataToInsert,
          employeeId: req.body.empId,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          photo: req.body.profilePic,
          //   'reportingTo': {
          //     'id': req.body.asmSalesmanMappingObject.asmId || '',
          //     'name': req.body.asmSalesmanMappingObject.name || '',
          //     'emailId': req.body.asmSalesmanMappingObject.emailId || ''
          //   }
        };

      let isInserted = await Model.create(req.body)

        .then((res) => {
          return {
            success: true,
            data: res,

            //return this.success(req, res, this.status.HTTP_OK, isInserted);
          };
        })
        .catch((err) => {
          console.error(err);
          return {
            success: false,
            error: err,
          };
        });

      // check if inserted
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT);

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


  get = async (req,res) => {

    try {
      info('Employee GET DETAILS !');
      // get the brand id
      let employeeId = req.query.employeeId;
      // inserting data into the db
      // let transporter = await Model.findOne({
      let employee = await Model.findById({

        _id: mongoose.Types.ObjectId(employeeId)

      }).lean();
      // check if inserted
      if (employee && !_.isEmpty(employee)) return this.success(req, res, this.status.HTTP_OK, employee);

      else return this.errors(req, res, this.status.HTTP_CONFLICT);

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

   //delete Employee
   deleteEmployee = async (req, res) => {
    try {
      info("Employee Delete!");
      //let employeeId = req.query.employeeId;
      // inserting the new user into the db
      let employeeId = req.query.employeeId || '';

      // creating data to update
      let dataToUpdate = {
        $set: {
          status: 0,
          isDeleted: 1
        }
      };

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(employeeId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      })

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, {}, );
      else return this.errors(req, res, this.status.HTTP_CONFLICT);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  };



}

// exporting the modules
module.exports = new deliveryExecutiveCtrl();
