// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const BasicCtrl = require('../components/basic_config/basic_config.controller');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const {
  error,
  info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Hashing the password field in the request!');
    // getting the total salt rounds
    const saltRounds = await BasicCtrl.GET_MIN_SALT_ROUND_FOR_HASHING().then((res) => { if (res.success) return res.data; else return 10; });

    // traverse the array
    for (let i = 0; i < req.body.length; i++) {
      // generate random password
      let password = crypto.randomBytes(10).toString('hex');

      // if request body password is present or not
      if (password) {
        let hashedPassword = bcrypt.hashSync(password, saltRounds); // hashing the password
        req.body[i].actualPassword = password; // actual password string 
        req.body[i].password = hashedPassword; // hashing the password
      } else throw new Error('Password Not Generated !, Try after some time!');
    }

    // move on
    next(); // move on to the next controller 

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
