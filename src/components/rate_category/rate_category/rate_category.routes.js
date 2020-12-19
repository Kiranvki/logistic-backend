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
} = require('../../../hooks');

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');

// exporting the rate category routes 
function ratecategory() {
  return (open, closed) => {
    // add the rate category controller in the packing stage 
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


    closed.route('/:rateCategoryId').get(
      //[joiTransporterMaster], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.getRateCategory // get controller 
    );


    closed.route('/:rateCategoryId').patch(
      //[joiTransporterMaster], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.patchtRateCategory // get controller 
    );

    //deleting the rate category, vehicle and transporter mapping
    closed.route('/:rateCategoryId').delete(
      // [joiDeleteTransporeter], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.deleteRateCategoryVehicleTranporterMapping // delete controller 
    );

  }
}




module.exports = ratecategory();