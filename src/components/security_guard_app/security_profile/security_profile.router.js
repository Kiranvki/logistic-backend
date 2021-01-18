const ctrl = require('./security_profile.controller');

// library
const multer = require('multer');
const multipartMiddleware = multer();


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

 }
}

module.exports = deliveryUserRoutes();