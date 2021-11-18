const ctrl = require("./delivery_profile.controller");

// library
const multer = require("multer");
const multipartMiddleware = multer();


// hooks 
const {
  checkWhetherItsAValidDeliveryUpdate, //check whether its a valid picker profile update
  isValidProfilePicUpload
} = require('../../../hooks/app');

// auth
const { verifyDeliveryAppToken } = require("../../../hooks/app/Auth");

// exporting the user routes
function deliveryUserRoutes() {
  //open, closed
  return (open, closed) => {
    // get Delivery Executive details
    closed.route("/user/details").get(
      verifyDeliveryAppToken, // verify app user token
      ctrl.getDeliveryUserDetails // controller function
    );

    // update Delivery Executive details
    // closed.route("/user/update").patch(
    //   verifyDeliveryAppToken, // verify app user token
    //   checkWhetherItsAValidDeliveryUpdate, //check whether its a valid picker profile update
    //   multipartMiddleware.single('profilePhoto'),
    //   isValidProfilePicUpload,
    //   ctrl.updateDeliveryUserDetails // update user details
    // );

    // upload file to server 
    closed.route('/user/:deliveryExId/file/upload').post(
      verifyDeliveryAppToken, // verify app token
      multipartMiddleware.single('file'), // multer middleware
      // [joiValidationForFileUpload], // joi validation
      // isValidOnBoardingId,  // check whether the onboarding id is valid or not 
      // isValidOnBoardingUpload,
      isValidProfilePicUpload,
      ctrl.uploadImage, // controller function
    );
  };
}

module.exports = deliveryUserRoutes();
