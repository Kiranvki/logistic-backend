const userDeliverySessionCtrl = require('../../../components/delivery_app/onBoard/app_delivery_user_session/app_delivery_user_session.controller');

// Responses & others utils 
const Response = require('../../../responses/response');
const StatusCodes = require('../../../facades/response');
const MessageTypes = require('../../../responses/types');
const Exceptions = require('../../../exceptions/Handler');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.appSecret;
const {
  error,
  info
} = require('../../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Verifying the app user token');

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

    // check the payload 
    if (payload && payload.error && payload.error == 'tokenExpired') {
      return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.tokenExpired);
    }

    // checking the session with the latest session key 
    if (payload && payload.data && JSON.parse(payload.data)) {
      let data = JSON.parse(payload.data);
      // let isValidUserSession = { // COMMENT FOR PROD
      //   success: true
      // };
      let isValidUserSession = await userDeliverySessionCtrl.getUserToken(data._id); // UNCOMMEMT FOR PROD

      // check session data is available 
      if (isValidUserSession.success && isValidUserSession.data.sessionKey == token) {  // UNCOMMEMT FOR PROD
        // if (isValidUserSession.success) { // COMMENT FOR PROD
        info('Valid User Token !');

        // injecting into request user 
        req.user = {
          token: token,
          //  recSessionToken: isValidUserSession.data.recSessionKey,
          ...JSON.parse(payload.data)
        };

        // as one user is allocated to one city
        // if (req.user.cityId)
        //   req.params.city = req.user.cityId;
        // else return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.cityNotAllocatedToTheAdmin);

        // move on
        return next();

      } else return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.unauthorizedUser);
    } else return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.unauthorizedUser);

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
