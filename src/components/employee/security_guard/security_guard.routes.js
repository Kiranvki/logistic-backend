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
  isValidEmployeeId, // checking wheather the employee id valid or not
  checkWhetherItsAValidEmployeeUpdate, // check whether its a valid employee update
} = require('../../../hooks');

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');


//exporting the security guard routes
function securityRoutes() {
  return (open, closed) => {

    // create employee
    closed.route('/').post(
      [joiEmployeCreate], // joi validation
      verifyUserToken,      // verify user token
      isValidAgencyId, // checking whether the agency is valida or not
      getDetailsFromZoho, // get details from zoho
      ctrl.post              // controller function 
    );

    //patch api for all employees
    closed.route('/type/:employeeType/:employeeId').patch(
      [joiEmployePatch], // joi validation
      verifyUserToken,   // verify user token
      checkWhetherItsAValidEmployeeUpdate,
      ctrl.patchEmployee // controller function 
    );

    //get single employee details base on the type
    closed.route('/:employeeId/:employeeType').get(
      [joiEmployeeGetDetails], // joi validation
      verifyUserToken,         // verify user token
      isValidEmployeeId,   // check whether its a valid employee
      ctrl.getEmployee // controller function 
    );

    //delete the employee based on the type
    closed.route('/:employeeId/:employeeType').delete(
      [joiEmployeeGetDetails], // joi validation
      verifyUserToken,        // verify user token
      //   isValidEmployeeId,
      ctrl.deleteEmployee // controller function 
    );

    //get the security guard list
    closed.route('/securityGuard').get(
      // [joiTransporterList], // joi validation
      verifyUserToken,         // verify user token
      ctrl.getList // controller function 
    );


    //getting the details from zoho
    closed.route('/').get(
      [joiGetZohoDetails], // joi validation
      verifyUserToken,      // verify user token
      getDetailsFromZohoUsingEmpID, // get details from zoho using empid
      ctrl.getZohoDetails              // controller function 
    );

    // activate or deactive security guard
    closed.route('/:employeeType/:employeeId/status/:type').patch(
      [joiEmployeeChangeStatus], // joi validation
      verifyUserToken,      // verify user token
      // isDistributorAlreadyActiveOrInactive, // is already active or inactive 
      ctrl.patchSecurityGuardStatus // get controller 
    );

  }
}
module.exports = securityRoutes();