// user controller 
const ctrl = require('./security_guard.controller');

// custom joi validation
const {
  joiEmployeCreate, // create a new employee
  joiGetZohoDetails,  //getting the details from zoho
} = require('./security_guard.validators');

// hooks 
const {
  getDetailsFromZoho, // get details from zoho
  getDetailsFromZohoUsingEmpID, // get details from zoho using empid
  isValidAgencyId, // checking whether the agency is valida or not
} = require('../../../hooks');

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');


//exporting the security guard routes
function securityRoutes(){
    return (open, closed) => {
    // post
    closed.route('/').post(
      [joiEmployeCreate], // joi validation
      verifyUserToken,      // verify user token
      isValidAgencyId, // checking whether the agency is valida or not
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

    //getting the details from zoho
    closed.route('/').get(
      [joiGetZohoDetails], // joi validation
      verifyUserToken,      // verify user token
      getDetailsFromZohoUsingEmpID, // get details from zoho using empid
      ctrl.getZohoDetails              // controller function 
    );

       // activate or deactive Security Guard
       closed.route('/:securityguardId/status/:type').patch(
        //[joiDistributorChangeStatus], // joi validation
        // isDistributorAlreadyActiveOrInactive, // is already active or inactive 
        ctrl.patchSecurityGuardStatus // get controller 
      );

  }
}
module.exports = securityRoutes();