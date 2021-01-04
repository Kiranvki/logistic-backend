// user controller 
const ctrl = require('./security_guard.controller');

//exporting the security guard routes
function securityRoutes(){
    return (open, closed) => {
    // post
    closed.route('/employee').post(
       // [joiSecurityGuardCreate], // joi validation
        //verifyUserToken,      // verify user token
        ctrl.post              // controller function 
      );


      closed.route('/getEmployee').get(
        //[joiTransporterGetDetails], // joi validation
        // verifyAppToken,
        //isValidTransporter,
        ctrl.getEmployeer // controller function 
      );

    
    // closed.route('/:employeeId').get(
    //     //[joiTransporterGetDetails], // joi validation
    //     // verifyAppToken,
    //     //isValidTransporter,
    //     ctrl.getEmployeer // controller function 
    //   );

      closed.route('/getEmployee').delete(
        //[joiTransporterGetDetails], // joi validation
        // verifyAppToken,
        //isValidTransporter,
        ctrl.deleteEmployee // controller function 
      );

    // closed.route('/:employeeId').delete(
    //     //[joiTransporterGetDetails], // joi validation
    //     // verifyAppToken,
    //     //isValidTransporter,
    //     ctrl.deleteEmployee // controller function 
    //   );

    //   closed.route('/:employeeId').patch(
    //     //[joiTransporterGetDetails], // joi validation
    //     // verifyAppToken,
    //     //isValidTransporter,
    //     ctrl.patchEmployee // controller function 
    //   );

    closed.route('/getEmployee').patch(
        //[joiTransporterGetDetails], // joi validation
        // verifyAppToken,
        //isValidTransporter,
        ctrl.patchEmployee // controller function 
      );
}
}
module.exports = securityRoutes();