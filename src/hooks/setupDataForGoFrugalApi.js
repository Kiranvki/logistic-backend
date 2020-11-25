// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const {
  error,
  info
} = require('../utils').logging;
const {
  creds
} = require('../config/goFrugal');
// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Setup GoFrugal Data !');

    const city = req.params.city || undefined; // city 
    const basicConfig = creds[city]; // goFrugal Config

    // setting up the url and token
    let url = basicConfig.url || undefined,
      accessToken = basicConfig['x-auth-token'];

    // check whether the email and url is valid or not 
    if (url && accessToken) {
      req.body = {
        ...req.body,
        url: url,
        accessToken: accessToken
      };

      // move on
      next();
    } else {
      error('Go Frugal Server Config Not Available !'); // route doesnt exist 
      return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, MessageTypes.customers.goFrugalConfigNotFound);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
