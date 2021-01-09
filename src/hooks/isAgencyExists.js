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

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the user email id is unique or not!');

    let name = req.body.name || ''; // get the email id 

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

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
