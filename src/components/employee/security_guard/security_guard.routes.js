// user controller 
const ctrl = require('./security_guard.controller');

// custom joi validation
const {
  joiEmployeCreate, // create a new employee
  joiGetZohoDetails,  //getting the details from zoho
  joiEmployePatch, // joi employee patch
} = require('./security_guard.validators');

// hooks 
const {
  getDetailsFromZoho, // get details from zoho
  getDetailsFromZohoUsingEmpID, // get details from zoho using empid
  isValidAgencyId, // checking whether the agency is valida or not
  checkWhetherItsAValidEmployeeUpdate, // check whether its a valid employee update
} = require('../../../hooks');

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');


//exporting the security guard routes
function securityRoutes() {
  return (open, closed) => {
    // post
    closed.route('/').post(
      [joiEmployeCreate], // joi validation
      verifyUserToken,      // verify user token
      isValidAgencyId, // checking whether the agency is valida or not
      getDetailsFromZoho, // get details from zoho
      ctrl.post              // controller function 
    );

    closed.route('/employee/:employeeId/:employeeType').get(
      //[joiTransporterGetDetails], // joi validation
      // verifyUserToken,
      //isValidTransporter,
      ctrl.getEmployeer // controller function 
    );

    closed.route('/list/securityguard').get(
      // [joiTransporterList], // joi validation
      // verifyUserToken,
      ctrl.getList // controller function 
    );

    closed.route('/employee/:employeeId/:employeeType').delete(
      //[joiTransporterGetDetails], // joi validation
      // verifyUserToken,
      //isValidTransporter,
      ctrl.deleteEmployee // controller function 
    );

    closed.route('/employee/:employeeId/:employeeType').patch(
      [joiEmployePatch], // joi validation
      verifyUserToken,
      checkWhetherItsAValidEmployeeUpdate,
      ctrl.patchEmployee // controller function 
    );

    //getting the details from zoho
    closed.route('/').get(
      [joiGetZohoDetails], // joi validation
      verifyUserToken,      // verify user token
      getDetailsFromZohoUsingEmpID, // get details from zoho using empid
      ctrl.getZohoDetails              // controller function 
    );

    //  // activate or deactive security guard
    closed.route('/:employeeType/:employeeId/status/:type').patch(
      //[joiDistributorChangeStatus], // joi validation
      // isDistributorAlreadyActiveOrInactive, // is already active or inactive 
      ctrl.patchSecurityGuardStatus // get controller 
    );
  }
}
module.exports = securityRoutes();