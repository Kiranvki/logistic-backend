// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.secret;
const {
  error,
  info
} = require('../../utils').logging;
const {
  getTokenDetails
} = require('../../inter_service_api/user_server/v1');

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Verifying the user token');

    // checking the token
    if (req.headers['x-access-token'] === undefined) {
      error('x-access-token header not present');
      return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.authTokenIsRequired);
    }

    // getting the token 
    let token = req.headers['x-access-token'];

    // check token is present 
    if (!token) {
      return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.invalidToken);
    }

    // get jwt payload 
    let payload = await jwt.verify(token, jwtSecret, function (err, payload) {
      if (err) {
        error('JWT Expired or Invalid Token !', err); // route doesnt exist 
        return {
          error: 'tokenExpired'
        }
      } else return payload;
    });

    // check for payload 
    if (payload && payload.error && payload.error == 'tokenExpired') {
      return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.tokenExpired);
    }

    // console.log('The payload here is ---> ', payload.data);
    if (payload && payload.data && JSON.parse(payload.data)) {
      req.user = {
        token: token,
        ...JSON.parse(payload.data)
      };

      // verify token details 
      let dataFromUserMicroService = await getTokenDetails(req.user.token) //requesting the data from token microservice

      // if token verified successfully
      if (dataFromUserMicroService.success) {
        if (req.user.email == dataFromUserMicroService.data.email) {
          info('Injecting the data into the req body')
          return next();
        }
        else {
          error('Unauthorised User !');
          return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.unauthorizedUser);
        }
      }
      else {
        error('Unauthorized User!');
        return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.unauthorizedUser);
      }
    } else {
      error('Unauthorized User!');
      return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.unauthorizedUser);
    }

    // catch any internal server error
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
