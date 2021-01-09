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

    // create agency list for security
    closed.route('/security-agency').post(
      [joiCreate], // joi validation
      verifyUserToken, // jwt authentication
      isAgencyExists, // check whether the agency exist  
      ctrl.create // controller function
    );

    // get agencies list for security guard
    closed.route('/security-agency/list').get(
      [joiGetList], // joi validation
      verifyUserToken, // jwt authentication
      ctrl.getList // controller function
    );

    // get agencies list for delivery and picker boy
    closed.route('/delivery-agency/list').get(
      [joiGetList], // joi validation
      verifyUserToken, // jwt authentication
      ctrl.getDeliveryAndPickerAgencyList // controller function
    );

    // create agency list for delivery and picker boy
    closed.route('/delivery-agency').post(
      [joiCreate], // joi validation
      verifyUserToken, // jwt authentication
      isAgencyExists, // check whether the agency exist  
      ctrl.create // controller function
    );
  };
}

module.exports = userRoutes();
