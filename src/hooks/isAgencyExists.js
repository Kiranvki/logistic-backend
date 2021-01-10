// Controller
const agencyCtrl = require('../components/agency/agencies/agencies.controller');

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const CamelCase = require('camelcase');
const {
  error,
  info
} = require('../utils').logging;

const {
  checkWhetherAgencyNameAlreadyExist  //check whether the agency name already exist or not
} = require('../inter_service_api/dms_dashboard_v1/v1');


// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the agency is  unique or not!');
    let name = req.body.name || '',// get the agency id 
      designation = req.params.designation || '',
      cityId = req.user.region || '';


    //checking whether the designation name is securityGuard
    if (designation && designation == 'securityGuard') {
      // check whether the name is unique or not 
      let isNameExists = await agencyCtrl.isNameExists(CamelCase(name));

      // if name exists
      if (isNameExists.success) {
        error('Name is not unique !'); // route doesnt exist 
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.agencies.agencyNameNotUnique);
      } else {

        // injecting into the request body
        req.body.camelCase = CamelCase(name);

        // MOVE ON 
        next();
      }
      //condition if the designation is pickerBoy or deliveryExecutive
    } else {

      let checkAgencyExistResponse = await checkWhetherAgencyNameAlreadyExist(name, cityId);
      if (checkAgencyExistResponse.success) {
        error('Name is not unique !'); // route doesnt exist 
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.agencies.agencyNameNotUnique);
      } else {

        // injecting into the request body
        req.body.camelCase = CamelCase(name);

        // MOVE ON 
        next();
      }

    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
