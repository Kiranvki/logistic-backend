// user controller 
const ctrl = require('./security_guard.controller');

// custom joi validation
const {
  joiSecurityGuard, // create a new SecurityGuard
} = require('./security_guard.validators');


//exporting the security guard routes
function securityRoutes(){
    return (open, closed) => {
    // post
    closed.route('/:employeeType').post(
        [joiSecurityGuard], // joi validation
        //verifyUserToken,      // verify user token
        ctrl.post              // controller function 
      );

      closed.route('/getEmployee/:employeeId/:employeeType').get(
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

      closed.route('/getEmployee/:employeeId/:employeeType').delete(
        //[joiTransporterGetDetails], // joi validation
        // verifyAppToken,
        //isValidTransporter,
        ctrl.deleteEmployee // controller function 
      );

    closed.route('/getEmployee/:employeeId/:employeeType').patch(
        //[joiTransporterGetDetails], // joi validation
        // verifyAppToken,
        //isValidTransporter,
        ctrl.patchEmployee // controller function 
      );
}
}
module.exports = securityRoutes();