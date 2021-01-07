// user controller
const ctrl = require("./picker_boy.controller");

// custom joi validation
const {
  joiPickerBoyGetDetails, // get the saleman details
  joiIdInParams, // check joi id in params
  joiPickerBoyList, // get salesman list
  joiPickerBoyCreate, // create a new salesman
} = require("./picker_boy.validators");

// hooks
const {
  isValidAgencyId, // is valid agency id or not
  getDetailsFromZoho, // get details from zoho
} = require("../../../hooks");

// app hooks
const {
  // getAdoptionMetricDetailsForInternal, // get adoption details
  isValidPickerBoy, // get the PickerBoy details
} = require("../../../hooks/app");

const { verifyAppToken } = require("../../../hooks/app/Auth");

const { verifyUserToken } = require("../../../hooks/Auth");

// exporting the user routes
function userRoutes() {
  //open, closed
  return (open, closed) => {
    // closed
    // post

    // get pickerboy details
    closed.route("/picker-boy/:pickerBoyId").get(
      [joiPickerBoyGetDetails], // joi validation
      verifyUserToken, // verify user token
      isValidPickerBoy, // check is valid asm id
      ctrl.getPickerBoyDetails // get controller
    );

    //creating a new picker-boy
    closed.route("/picker-boy").post(
      [joiPickerBoyCreate], // joi validation
      verifyUserToken, // verify user token
      isValidAgencyId, // check whether the agency id is valid or not
      getDetailsFromZoho, // get details from zoho
      ctrl.post // controller function
    );

    // get picker-boy list
    closed.route("/picker-boy").get(
      [joiPickerBoyList], // joi validation
      verifyUserToken, // verify user token
      ctrl.getList // controller function
    );

    // get all
    closed.route("/list/pickerboy").get(
      // [joiTransporterList], // joi validation
      // verifyAppToken,
      ctrl.getPickerBoy // controller function
    );
  };
}

module.exports = userRoutes();
