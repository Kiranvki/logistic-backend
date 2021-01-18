const ctrl = require('./delivery_profile.controller');

// library
const multer = require('multer');
const multipartMiddleware = multer();


// auth 
const {
    verifyDeliveryAppToken
  } = require('../../../hooks/app/Auth');
  
// exporting the user routes 
function deliveryUserRoutes() {
 //open, closed
 return (open, closed) => {
   // get picker Boy details 
   closed.route('/user/details').get(
    verifyDeliveryAppToken, // verify app user token 
    ctrl.getDeliveryUserDetails // controller function 
  );

 }
}

module.exports = deliveryUserRoutes();