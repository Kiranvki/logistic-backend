// controllers
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/security_guard.model')
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

//getting the model
class securityController extends BaseController{
    //constructor
    constructor(){
        super();
        this.messageTypes = this.messageTypes.securityGuard;
    }
  // Internal Function to check whether the salesman exist or not
  isExist = async (empId, isWaycoolEmployer) => {
    try {
      info('Checking whether the security already exist or not !', empId);

      // creating the data inside the database 
      return Model
        .findOne({
          'employeeId': empId,
          'isWaycoolEmp': isWaycoolEmployer,
          'isDeleted': 0
        })
        .lean()
        .then((res) => {
          if (res && !_.isEmpty(res))
            return {
              success: true,
            };
          else return {
            success: false
          }
        });
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
module.exports = new securityController();