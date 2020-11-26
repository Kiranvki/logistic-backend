// user controller 
const ctrl = require('./agencies.controller');
// custom joi validation
const {
  joiCreate, // joi token validation
  joiGetList, // joi get list
} = require('./agencies.validators');

// custom hooks 
const {
  isAgencyExists, // is email exist 
} = require('../../../hooks')

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');

// exporting the user routes 
function userRoutes() {
  return (open, closed) => {

    // create
    closed.route('/').post(
      [joiCreate], // joi validation
      verifyUserToken, // jwt authentication
      isAgencyExists, // check whether the agency exist  
      ctrl.create // controller function
    );

    // get agencies list 
    closed.route('/list').get(
      [joiGetList], // joi validation
      verifyUserToken, // jwt authentication
      ctrl.getList // controller function
    );
  };
}

module.exports = userRoutes();
