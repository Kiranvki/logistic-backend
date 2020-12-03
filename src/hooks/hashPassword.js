// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const BasicCtrl = require('../components/basic_config/basic_config.controller');
const bcrypt = require('bcryptjs');
const {
  error,
  info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Hashing the password field in the request!');
    const saltRounds = await BasicCtrl.GET_MIN_SALT_ROUND_FOR_HASHING().then((res) => { if (res.success) return res.data; else return 10; });

    // if request body password is present or not
    if (!req.body.password) {
      error('Password field Doesn\'t exist'); // user doesnt exist 
      Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.userAuthentication.passwordMissing);
    } else {
      let hashedPassword = bcrypt.hashSync(req.body.password, saltRounds); // hashing the password
      req.body.password = hashedPassword; // hashing the password
      next(); // move on to the next controller 
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
