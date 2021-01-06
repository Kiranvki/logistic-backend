// controllers
const BasicCtrl = require("../../basic_config/basic_config.controller");
const BaseController = require("../../baseController");
const Model = require("./models/security_guard.model");
const mongoose = require("mongoose");
const deliveryCtrl = require("../delivery_executive/delivery_executive.controller");
const pickerBoyCtrl = require("../picker_boy/picker_boy.controller");
const _ = require("lodash");
const { error, info } = require("../../../utils").logging;

//getting the model
class securityController extends BaseController {
  //constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.employee;
  }

  // getting the security guard details using other fields
  getDetailsUsingField = async (fieldValue) => {
    try {
      info("Get security guard details !");

      // find the  security guard
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
            error("Error Searching Data in  security guard DB!");
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

  // get details of security guard
  getDetails = async (securityGuardId) => {
    try {
      info("Get Security details !");
      // find the security guard
      // get details
      return Model.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(securityGuardId),
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
            error("Error Searching Data in security Guard DB!");
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

  // Internal Function to check whether the Security Guard exist or not
  isExist = async (empId, isWaycoolEmployer) => {
    try {
      info("Checking whether the security already exist or not !", empId);

      // creating the data inside the database
      return Model.findOne({
        employeeId: empId,
        isWaycoolEmp: isWaycoolEmployer,
        isDeleted: 0,
      })
        .lean()
        .then((res) => {
          if (res && !_.isEmpty(res))
            return {
              success: true,
            };
          else
            return {
              success: false,
            };
        });
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };

  post = async (req, res) => {
    if (req.body.position == "deliveryExecutive") {
      let deliveryResponse = await deliveryCtrl.create(req, res);
      return;
    } else if (req.body.position == "pickerBoy") {
      let pickerboyResponse = await pickerBoyCtrl.post(req, res);
      return;
    }

    try {
      info("Create a new Security Guard !");

      // get the firstname
      // req.body.firstName = req.body.isWaycoolEmp == false ? req.body.firstName.replace(
      //   /\w\S*/g,
      //   function (txt) {
      //     return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      //   }) : req.body.userData.firstName.replace(
      //     /\w\S*/g,
      //     function (txt) {
      //       return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      //     });

      // // sentence case the last name
      // req.body.lastName = req.body.isWaycoolEmp == false ? req.body.lastName.replace(
      //   /\w\S*/g,
      //   function (txt) {
      //     return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      //   }) : req.body.userData.lastName.replace(
      //     /\w\S*/g,
      //     function (txt) {
      //       return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      //     });

      // getting the full name
      let fullName = `${req.body.firstName} ${req.body.lastName}`;

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
        fullName: fullName,
        //'createdById': req.user._id,
        //'createdBy': req.user.email || 'admin',
        //'warehouseId': mongoose.Types.ObjectId(req.user.warehouseId) || null,
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
          //   reportingTo: {
          //     id: req.body.asmSalesmanMappingObject.asmId || "",
          //     name: req.body.asmSalesmanMappingObject.name || "",
          //     emailId: req.body.asmSalesmanMappingObject.emailId || "",
          //   },
        };

      // inserting data into the db
      let isInserted = await Model.create(dataToInsert);

      // check if inserted
      if (isInserted && !_.isEmpty(isInserted)) {
        info("Salesman Successfully Created !");
        // returning success
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          isInserted,
          this.messageTypes.employeeCreated
        );
      } else
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.employeeNotCreated
        );

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

  //   // get details
  //   getEmployeer = async (req, res) => {

  //       try {
  //         info('Employee GET DETAILS !');
  //         // get the brand id
  //         let employeeId = req.query.employeeId;
  //         let empType = req.query.employeeType;

  //         if (empType == "deliveryExecutive") {
  //             let deliveryResponse = await deliveryCtrl.get(req, res)
  //             return;
  //           } else if (empType == "pickerBoy") {
  //             let pickerboyResponse = await pickerBoyCtrl.get(req, res);
  //             return;
  //           }
  //         // inserting data into the db
  //         // let transporter = await Model.findOne({
  //         let employee = await Model.findById({

  //           _id: mongoose.Types.ObjectId(employeeId)

  //         }).lean();
  //         // check if inserted
  //         if (employee && !_.isEmpty(employee)) return this.success(req, res, this.status.HTTP_OK, employee);

  //         else return this.errors(req, res, this.status.HTTP_CONFLICT);

  //         // catch any runtime error
  //       } catch (err) {
  //         error(err);
  //         this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  //       }
  //     }

  //delete Employee

  getEmployeer = async (req, res) => {
    // try {
    //   info('Roles GET DETAILS !');

    try {
      info("Employee GET DETAILS !");
      // get the brand id
      let employeeId = req.params.employeeId;
      let empType = req.params.employeeType;
      console.log("sadsa", req.params);

      if (empType == "deliveryExecutive") {
        let deliveryResponse = await deliveryCtrl.get(req, res);
        return;
      } else if (empType == "pickerBoy") {
        let pickerboyResponse = await pickerBoyCtrl.get(req, res);
        return;
      } else if (empTypee == "securityGuard") {
        // inserting data into the db
        let employee = await Model.findOne({
          _id: mongoose.Types.ObjectId(req.params.employeeId),
          isDeleted: 0,
        }).lean();

        console.log("Emmm", employee);
        // check if inserted
        if (employee && !_.isEmpty(employee))
          return this.success(req, res, this.status.HTTP_OK, employee);
        else return this.errors(req, res, this.status.HTTP_CONFLICT);

        // catch any runtime error
      } else {
        return this.errors(req, res, this.status.HTTP_CONFLICT);
      }
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

  //       // inserting data into the db
  //       let isUpdated = await Model.findOneAndUpdate({
  //         _id: mongoose.Types.ObjectId(employeeId)
  //       }, dataToUpdate, {
  //         new: true,
  //         upsert: false,
  //         lean: true
  //       })

  //       // check if inserted
  //       if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, {});
  //       else return this.errors(req, res, this.status.HTTP_CONFLICT);

  //       // catch any runtime error
  //     } catch (err) {
  //       error(err);
  //       this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  //     }

  //   }

  deleteEmployee = async (req, res) => {
    try {
      info("Employee Delete!");
      let employeeId = req.params.employeeId;
      let empType = req.params.employeeType;

      if (empType == "deliveryExecutive") {
        let deliveryResponse = await deliveryCtrl.deleteEmployee(req, res);
        return;
      } else if (empType == "pickerBoy") {
        let pickerboyResponse = await pickerBoyCtrl.deleteEmployee(req, res);
        return;
      } else if(employeeType == "securityGuard"){
      // inserting the new user into the db

      // let employeeId = req.query.employeeId || '';

      // creating data to insert
      let dataToUpdate = {
        $set: {
          // status: 0,
          isDeleted: 1,
        },
      };

      // inserting data into the db
      //   let isUpdated = await Model.findOneAndUpdate({
      let isUpdated = await Model.updateOne(
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
      // .then(async (res) => {

      // if (req.body.asmSalesmanMappingIds && Array.isArray(req.body.asmSalesmanMappingIds) && req.body.asmSalesmanMappingIds.length)
      //   return AsmSalesmanCtrl.disableWithIdsArray(req.body.asmSalesmanMappingIds).then((isMappingDeleted) => { if (isMappingDeleted.success) return true; else return false });
      // else
      //   return true
      // });

      // check if inserted
      if (isUpdated && !_.isEmpty(isUpdated))
        return this.success(req, res, this.status.HTTP_OK, {});
      else return this.errors(req, res, this.status.HTTP_CONFLICT);

      // catch any runtime error
    } else {
      return this.errors(req, res, this.status.HTTP_CONFLICT);
    }
  }catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  // // // patch the request
  patchEmployee = async (req, res) => {
    try {
      info("Employee CHANGE ! !");

      let employeeId = req.params.employeeId;
      let empType = req.params.employeeType;

      if (empType == "deliveryExecutive") {
        let deliveryResponse = await deliveryCtrl.updateDeliveryExecutiveDetails(
          req,
          res
        );
        return;
      } else if (empType == "pickerBoy") {
        let pickerboyResponse = await pickerBoyCtrl.updatePickerBoyDetails(
          req,
          res
        );
        return;
      }else if(empType == "securityGuard"){
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
        return this.success(req, res, this.status.HTTP_OK, isUpdated);
      else return this.errors(req, res, this.status.HTTP_CONFLICT);

      // catch any runtime error
    }else {
      return this.errors(req, res, this.status.HTTP_CONFLICT);
    }
   }
    catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };
}
// exporting the modules
module.exports = new securityController();
