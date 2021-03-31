// controller
const BasicCtrl = require('../../components/basic_config/basic_config.controller');
const warehouseCtrl =  require('../../../assests/warehouse/warehouse.controller')
// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const secret = process.env.appSecret;
const jwt = require('jsonwebtoken');
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Generate TOKEN for App Users !');
    // getting the token expiry time 

    const expiryTime = 24 * 60; // 24 hrs to mins 
    let jwtToken = '';
    let warehouseDetails ={}
    if(req.body.isValidPickerBoy.plant_id){
      warehouseDetails= await warehouseCtrl.get(req.body.isValidPickerBoy.plant_id)
    }
    // get user data 
    if (req.body.isValidPickerBoy) {
      jwtToken = jwt.sign({
        data: JSON.stringify({
          _id: req.body.isValidPickerBoy._id,
          employerName: req.body.isValidPickerBoy.employerName,
          contactMobile: req.body.isValidPickerBoy.contactMobile,
          cityId: req.body.isValidPickerBoy.cityId,
          locationId: req.body.isValidPickerBoy.locationId,
          fullName: req.body.isValidPickerBoy.fullName,
          email: req.body.isValidPickerBoy.email,
          plant_id:req.body.isValidPickerBoy.plant_id,
          plant_code:warehouseDetails.code

        })
      }, secret, { expiresIn: parseInt(expiryTime) * 60 });
    } else return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, MessageTypes.userAuthentication.invalidLogin);

    // check whether the jwt is valid 
    if (jwt) {
      req.body.token = jwtToken; // jwt token 
      req.body.expiryTimeInMin = expiryTime; // expiry time

      // move on 
      return next();
    } else {
      console.error('Invalid Login !');
      return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, MessageTypes.userAuthentication.invalidLogin);
    }

    // catch internal server error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
