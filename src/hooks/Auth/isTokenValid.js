// user session controller 
//const UserSessionCtrl = require('../../components/users/user_session/user_session.controller');

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

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Verifying the admin token');

    // checking the token
    if (req.query.token === undefined) {
      error('x-access-token is not present');
      return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.authTokenIsRequired);
    }

    // getting the token 
    let token = req.query.token;

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

      // get the user id 
      let userId = req.user._id;

      // get user session
      let getCurrentTokenForTheUser = await UserSessionCtrl.getUserSession(userId);

      // compare the session key 
      if (getCurrentTokenForTheUser.success && getCurrentTokenForTheUser.data.sessionKey == token) {
        info('User Token Is Valid !');

        // injecting into the request body 
        req.user = {
          ...req.user,
          ...getCurrentTokenForTheUser.data.allocationDetails
        };

        // move on 
        return next();
      } else {
        error('Invalid Session !')
        return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.unauthorizedUser);
      }

    } else {
      error('Invalid Token !')
      return Response.errors(req, res, StatusCodes.HTTP_UNAUTHORIZED, MessageTypes.userAuthentication.unauthorizedUser);
    }
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
