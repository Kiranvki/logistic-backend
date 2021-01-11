// controller forget password 
const BaseController = require('../../../baseController');
const Model = require('./models/app_delivery_user_session.models');
const camelCase = require('camelcase');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../../../../utils').logging;
const _ = require('lodash');

class deliveryUserSessionController extends BaseController {
    super();
   //this.messageTypes = this.messageTypes.appUserOnBoard;
  }



// exporting the modules 
module.exports = new deliveryUserSessionController();