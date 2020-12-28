//rate category controller
const ctrl = require('./rate_category.controller');

// custom joi validation
const {
  joiRateCategoryCreate, // create asm 
  joiAsmList, // get asm list 
  joiAsmPatch, // joi asm patch
  joiIdInParams, // joi asm id in params
  joiZohoDetails, // zoho
  joiAsmGetDetails, // asm get details
  joiAsmChangeStatus, // asm change status
} = require('./rate_category.validators');

// hooks 
const {
  isValidAsm, // check whether the asm is valid 
  checkWhetherItsAValidRateCategoryUpdate,
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
      //[joiRateCategoryCreate], // joi validation
      // verifyAppToken,
      ctrl.post // controller function 
    );

    closed.route('/').get(
      //[joiTransporterCreate], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.getList // controller function 
    );

    // get minified list
    closed.route('/minified/list').get(
      //[joiTransporterCreate], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.getListMinified // controller function 
    );

    closed.route('/:rateCategoryId').get(
      //[joiTransporterMaster], // joi validation

      ctrl.getRateCategory // get controller 
    );


    closed.route('/:rateCategoryId').patch(
      //[joiTransporterMaster], // joi validation
      checkWhetherItsAValidRateCategoryUpdate,  // check whether its a valid update 
      ctrl.patchtRateCategory // get controller 
    );



    //deleting the rate category itself
    closed.route('/:rateCategoryId').delete(
      // [joiDeleteTransporeter], // joi validation

      ctrl.deleteRateCategory // delete controller 
    );

    //deleting the rate category, vehicle and transporter mapping
    closed.route('/rate-category-mapping/:rateCategoryVehicleTransporterMappingId').delete(
      // [joiDeleteTransporeter], // joi validation

      ctrl.deleteRateCategoryVehicleTranporterMapping // delete controller 
    );
  }
}




module.exports = ratecategory();