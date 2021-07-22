const ctrl = require('./security_profile.controller');

// library
const multer = require('multer');
const multipartMiddleware = multer();


// hooks 
const {
  checkWhetherItsAValidSecurityUpdate, //check whether its a valid picker profile update
} = require('../../../hooks/app');


// auth 
const {
    verifySecurityAppToken
  } = require('../../../hooks/app/Auth');
  
// exporting the user routes 
function deliveryUserRoutes() {
 //open, closed
 return (open, closed) => {
   // get security guard details 
   closed.route('/user/details').get(
    verifySecurityAppToken, // verify app user token 
    ctrl.getsecurityUserDetails // controller function 
  );

  // update Security Guard details
  closed.route("/user/update").patch(
    verifySecurityAppToken, // verify app user token
    checkWhetherItsAValidSecurityUpdate, //check whether its a valid Security profile update
    ctrl.updateSecurityUserDetails // update user details
  );

 }
}

module.exports = deliveryUserRoutes();