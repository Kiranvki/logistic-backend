// Controller
const agencyCtrl = require('../components/agency/agencies/agencies.controller');

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const {
  error,
  info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the user email id is unique or not!');

    let agencyId = req.body.agencyId; // get the agency id 

    if (agencyId) {
      // check whether the name is unique or not 
      let isValid = await agencyCtrl.isValid(agencyId);

      // if name exists
      if (isValid.success) {

        // injecting into the request body
        req.body.agencyName = isValid.data.nameToDisplay;

        // MOVE ON 
        next();
      } else {
        error('Agency ID Not Found !'); // route doesnt exist 
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.agencies.agencyNameIsInvalid);
      }
    } else next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
