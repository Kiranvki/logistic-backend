// user controller 
const ctrl = require('./security_guard.controller');

// custom joi validation
const {
  joiEmployeCreate, // create a new employee
  joiGetZohoDetails,  //getting the details from zoho
  joiEmployePatch, // joi employee patch
  joiEmployeeGetDetails, // joi employee get id
  joiEmployeeList, // joi security get list
  joiEmployeeChangeStatus, // employee changed status
} = require('./security_guard.validators');

// hooks 
const {
  getDetailsFromZoho, // get details from zoho
  getDetailsFromZohoUsingEmpID, // get details from zoho using empid
  isValidAgencyId, // checking whether the agency is valida or not
  isValidEmployee, // checking wheather the employee id valid or not
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
    //patch api 
    closed.route('/type/:employeeType/:employeeId').patch(
      [joiEmployePatch], // joi validation
      verifyUserToken,
      checkWhetherItsAValidEmployeeUpdate,
      ctrl.patchEmployee // controller function 
    );

    closed.route('/employee/:employeeId/:employeeType').get(
      [joiEmployeeGetDetails], // joi validation
      // verifyUserToken,
      isValidEmployee,
      ctrl.getEmployeer // controller function 
    );

    closed.route('/list/securityguard').get(
       [joiEmployeeList], // joi validation
      // verifyUserToken,
      ctrl.getList // controller function 
    );

    closed.route('/employee/:employeeId/:employeeType').delete(
      [joiEmployeeGetDetails], // joi validation
      // verifyUserToken,
      isValidEmployee,
      ctrl.deleteEmployee // controller function 
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
      [joiEmployeeChangeStatus], // joi validation
      // isDistributorAlreadyActiveOrInactive, // is already active or inactive 
      ctrl.patchSecurityGuardStatus // get controller 
    );
  }
}
module.exports = securityRoutes();