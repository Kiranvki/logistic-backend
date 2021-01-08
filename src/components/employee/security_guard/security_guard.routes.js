// user controller 
const ctrl = require('./security_guard.controller');

// custom joi validation
const {
  joiEmployeCreate, // create a new employee
} = require('./security_guard.validators');

// hooks 
const {
  getDetailsFromZoho, // get details from zoho
} = require('../../../hooks');


//exporting the security guard routes
function securityRoutes() {
  return (open, closed) => {
    // post
    closed.route('/').post(
      [joiEmployeCreate], // joi validation
      //verifyUserToken,      // verify user token
      getDetailsFromZoho, // get details from zoho
      ctrl.post              // controller function 
    );

    closed.route('/getemployee/:employeeId/:employeeType').get(
      //[joiTransporterGetDetails], // joi validation
      // verifyAppToken,
      //isValidTransporter,
      ctrl.getEmployeer // controller function 
    );

    closed.route('/list/securityguard').get(
      // [joiTransporterList], // joi validation
      // verifyAppToken,
      ctrl.getList // controller function 
    );

    closed.route('/getemployee/:employeeId/:employeeType').delete(
      //[joiTransporterGetDetails], // joi validation
      // verifyAppToken,
      //isValidTransporter,
      ctrl.deleteEmployee // controller function 
    );

    closed.route('/getemployee/:employeeId/:employeeType').patch(
      //[joiTransporterGetDetails], // joi validation
      // verifyAppToken,
      //isValidTransporter,
      ctrl.patchEmployee // controller function 
    );
  }
}
module.exports = securityRoutes();