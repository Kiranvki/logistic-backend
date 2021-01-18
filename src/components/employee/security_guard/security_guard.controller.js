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

  // sending the zoho details
  getZohoDetails = async (req, res) => {
    try {
      info("Zoho Employee Details!");

      if (req.body.userData && !_.isEmpty(req.body.userData)) {
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          req.body.userData,
          this.messageTypes.userDetailsFetched
        );
      } else
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.userDetailsNotFetched
        );
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

  // get employee details
  getEmployeeDetails = async (employeeId, employeeType) => {
    try {
      info(`Get Employee details for ${employeeType}`);

      // get details
      if (employeeType && employeeType == 'pickerBoy') {
        let pickerDetails = await pickerBoyCtrl.getDetails(employeeId);
        return pickerDetails;
      }
      if (employeeType && employeeType == 'deliveryExecutive') {
        let deliveryDetails = await deliveryCtrl.getDetails(employeeId);
        return deliveryDetails;
      }
      if (employeeType && employeeType == 'securityGuard') {
        let securityDetails = await Model.aggregate([
          {
            $match: {
              _id: mongoose.Types.ObjectId(employeeId),
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

        return securityDetails;
      }
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

  //employee create
  post = async (req, res) => {
    try {
      // get the firstname
      req.body.fullName = req.body.fullName.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });

      // creating data to insert
      let dataToInsert = {
        ...req.body.userData,
        fullName: req.body.fullName
          ? req.body.fullName
          : req.body.userData.fullName,
        isWaycoolEmp: req.body.isWaycoolEmp == true ? 1 : 0,
        employerName:
          req.body.isWaycoolEmp == true
            ? "Waycool Foods & Products Private Limited"
            : req.body.agencyName,
        agencyId: req.body.isWaycoolEmp == true ? null : req.body.agencyId,
        contactMobile: req.body.contactMobile,
        altContactMobile: req.body.altContactMobile,
        email: req.body.email,
        altEmail: req.body.altEmail,
        createdById: req.user._id || "",
        createdBy: req.user.email || "admin",
        managerName: req.body.managerName ? req.body.managerName : null,
        employeeId: req.body.empId,
      };

      //checking condition for delivery executive
      if (req.body.designation == "deliveryExecutive") {
        let deliveryResponse = await deliveryCtrl.create(dataToInsert);

        if (deliveryResponse.success) {
          return this.success(
            req,
            res,
            this.status.HTTP_OK,
            deliveryResponse.data,
            this.messageTypes.deliveryExecutiveCreated
          );
        } else {
          return this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.deliveryExecutiveNotCreated
          );
        }
      }

      //checking condition for picker boy
      if (req.body.designation == "pickerBoy") {
        let pickerboyResponse = await pickerBoyCtrl.create(dataToInsert);

        if (pickerboyResponse.success) {
          //success
          return this.success(
            req,
            res,
            this.status.HTTP_OK,
            pickerboyResponse.data,
            this.messageTypes.pickerBoyCreated
          );
        } else {
          return this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.pickerBoyNotCreated
          );
        }
      }

      //checking condition for security guard
      if (req.body.designation == "securityGuard") {
        info("Create a new Security Guard !");

        // inserting data into the db
        let isInserted = await Model.create(dataToInsert);

        // check if inserted
        if (isInserted && !_.isEmpty(isInserted)) {
          // returning success
          return this.success(
            req,
            res,
            this.status.HTTP_OK,
            isInserted,
            this.messageTypes.securityGuardCreated
          );
        } else
          return this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.securityGuardNotCreated
          );
      }
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

  // get security guard list
  getList = async (req, res) => {
    try {
      info("Get the security guard List !");

      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 60;
        }),
        searchKey = req.query.search || "",
        sortBy = req.query.sortBy || "createdAt",
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // get the list of asm in the allocated city
      let searchObject = {
        isDeleted: 0,
      };

      // creating a match object
      if (searchKey !== "")
        searchObject = {
          ...searchObject,
          $or: [
            {
              employeeId: {
                $regex: searchKey,
                $options: "is",
              },
            },
            {
              employerName: {
                $regex: searchKey,
                $options: "is",
              },
            },
          ],
        };

      // get the total rate category
      let totalTransporter = await Model.countDocuments({
        ...searchObject,
      });

      // get the Transporter list
      let transporterList = await Model.aggregate([
        {
          $match: {
            ...searchObject,
          },
        },
        {
          $sort: sortingArray,
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
      ]);

      // success
      return this.success(req, res, this.status.HTTP_OK, {
        results: transporterList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalTransporter,
        },
      });

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

  //get single employee details
  getEmployee = async (req, res) => {
    try {
      info('Single Employee GET DETAILS !');
      // get the employee data id
      let employeeType = req.param.employeeType;

      if (req.body.employeeData && !_.isEmpty(req.body.employeeData)) {
        if (employeeType == 'deliveryExecutive') {
          return this.success(req, res, this.status.HTTP_OK, req.body.employeeData, this.messageTypes.securityGuardFetchedSuccessfully);

        }
        if (employeeType == 'pickerBoy') {
          return this.success(req, res, this.status.HTTP_OK, req.body.employeeData, this.messageTypes.securityGuardFetchedSuccessfully);

        }
        if (employeeType == 'securityGuard') {

          return this.success(req, res, this.status.HTTP_OK, req.body.employeeData, this.messageTypes.securityGuardFetchedSuccessfully);

          // catch any runtime error
        }

      }
      else {
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.employeeDetailsNotFound);
      }
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  };

  deleteEmployee = async (req, res) => {
    try {
      info("Employee Delete!");
      let employeeId = req.params.employeeId;
      let employeeType = req.params.employeeType;

      if (employeeType == "deliveryExecutive") {
        let deliveryResponse = await deliveryCtrl.deleteEmployee(req, res);
        return;
      } else if (employeeType == "pickerBoy") {
        let pickerboyResponse = await pickerBoyCtrl.deleteEmployee(req, res);
        return;
      } else if (employeeType == "securityGuard") {
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

        // check if inserted
        if (isUpdated && !_.isEmpty(isUpdated))
          return this.success(
            req,
            res,
            this.status.HTTP_OK,
            {},
            this.messageTypes.securityGuardDeletedSuccessfully
          );
        else
          return this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.securityGuardeNotDeletedSuccessfully
          );

        // catch any runtime error
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.securityGuardeNotDeletedSuccessfully
        );
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

  // patch the request
  patchEmployee = async (req, res) => {
    try {
      info("Employee CHANGE ! !");

      let employeeId = req.params.employeeId;
      let employeeType = req.params.employeeType;

      if (employeeType == "deliveryExecutive") {
        let deliveryResponse = await deliveryCtrl.updateDeliveryExecutiveDetails(employeeId, req.body.toChangeObject);
        if (deliveryResponse.success) {
          return this.success(req, res, this.status.HTTP_OK, deliveryResponse.data, this.messageTypes.deliveryExecutiveUpdatedSuccessfully);
        } else
          return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.deliveryExecutiveNotUpdated);

      }
      if (employeeType == "pickerBoy") {
        let pickerboyResponse = await pickerBoyCtrl.updatePickerBoyDetails(employeeId, req.body.toChangeObject);
        if (pickerboyResponse.success) {
          return this.success(req, res, this.status.HTTP_OK, pickerboyResponse.data, this.messageTypes.pickerBoyUpdatedSuccessfully);
        } else
          return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.pickerBoyNotUpdated);


      }
      if (employeeType == "securityGuard") {

        // creating data to update
        let dataToUpdate = {
          $set: {
            ...req.body.toChangeObject
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
        if (isUpdated && !_.isEmpty(isUpdated)) {
          info("Security Guard Successfully updated !");
          return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.securityGuardUpdatedSuccessfully);
        } else
          return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.securityGuardNotUpdated);

        // catch any runtime error
      }
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  };


  // patch Security Guard status
  patchSecurityGuardStatus = async (req, res) => {
    try {
      info("Picker Boy STATUS CHANGE !");

      // type id
      let type = req.params.type,
        employeeId = req.params.employeeId;
      let empType = req.params.employeeType;

      if (empType == "deliveryExecutive") {
        let deliveryResponse = await deliveryCtrl.patchDeliveryExecutiveStatus(req, res);
        return;
      } else if (empType == "pickerBoy") {
        let pickerboyResponse = await pickerBoyCtrl.patchPickerBoyStatus(req, res);
        return;
      } else if (empType == "securityGuard") {
        // creating data to insert
        let dataToUpdate = {
          $set: {
            status: type == "activate" ? 1 : 0,
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

        // check if inserted
        if (isUpdated && !_.isEmpty(isUpdated))
          return this.success(
            req,
            res,
            this.status.HTTP_OK,
            isUpdated,
            type == "activate"
              ? this.messageTypes.securityguardActivatedSuccessfully
              : this.messageTypes.securityguardDeactivatedSuccessfully
          );
        else
          return this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.securityGuardNotUpdatedSuccessfully
          );

        // catch any runtime error
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
}
// exporting the modules
module.exports = new securityController();
