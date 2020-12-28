//rate category controller
const ctrl = require('./rate_category.controller');

// custom joi validation
const {
  joiRateCategoryCreate, // create rate category 
  joiRateCategoryList, // get list of rate category
  joiRateCategoryGetDetails, // get single rate category
  joiAsmList, // get asm list 
  joiAsmPatch, // joi asm patch
  joiIdInParams, // joi asm id in params

} = require('./rate_category.validators');

// hooks 
const {
  checkWhetherItsAValidRateCategoryUpdate, // check whether the its a valid RateCategory update
  isValidRateCategory, // check whether the RateCategory id valid or not
} = require('../../../hooks');

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');

// exporting the rate category routes 
function ratecategory() {
  return (open, closed) => {

    // post
    closed.route('/').post(
      [joiRateCategoryCreate], // joi validation
      //verifyUserToken,      // verify user token
      ctrl.post              // controller function 
    );

    //get all the rate category
    closed.route('/').get(
      [joiRateCategoryList], // joi validation
      //verifyUserToken,        // verify user token
      ctrl.getList            // controller function 
    );

    // get minified list
    closed.route('/minified/list').get(
      [joiRateCategoryList], // joi validation
      //verifyUserToken, // verify user token
      ctrl.getListMinified // controller function 
    );

    //get single rate category details
    closed.route('/:rateCategoryId').get(
      [joiRateCategoryGetDetails],     // joi validation
      //verifyUserToken,            // verify user token
      isValidRateCategory, // check is valid Rate Category id 
      ctrl.getRateCategory          // get controller 
    );


    closed.route('/:rateCategoryId').patch(
      //[joiTransporterMaster],   // joi validation
      //verifyUserToken,          // verify user token
      checkWhetherItsAValidRateCategoryUpdate,  // check whether its a valid update 
      ctrl.patchtRateCategory     // get controller 
    );

    //deleting the rate category itself
    closed.route('/:rateCategoryId').delete(
      [joiIdInParams], // joi validation
      //verifyUserToken,          // verify user token
      isValidRateCategory, // check is valid Rate Category id 
      ctrl.deleteRateCategory     // delete controller 
    );

    //adding the rate category, vehicle and transporter mapping
    closed.route('/rate-category-mapping/add-vehicle/:rateCategoryId').patch(
      // [joiDeleteTransporeter],   // joi validation
      //verifyUserToken,            // verify user token
      isValidRateCategory, // check is valid Rate Category id 
      ctrl.addRateCategoryVehicleTranporterMapping // delete controller 
    );

    //deleting the rate category, vehicle and transporter mapping
    closed.route('/rate-category-mapping/:rateCategoryVehicleTransporterMappingId').delete(
      // [joiDeleteTransporeter],   // joi validation
      //verifyUserToken,            // verify user token
      ctrl.deleteRateCategoryVehicleTranporterMapping // delete controller 
    );
  }
}




module.exports = ratecategory();