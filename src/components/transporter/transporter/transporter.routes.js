const ctrl = require('./transporter.controller');
const {
  // joiTransporterGetDetails,/
  joiTransporter,
  joiTransporterList,
  joiTransporterGetDetails,
  joiTransporterPatch,
  joiIdInParams,
  joiDistributorChangeStatus, // is Distributor changed status
  joiTransporterElementPatch,
  joiRateCategoryListByTransporterId,
  JoiGetVehicleByModelId,
  getTransporterById
} = require('./transporter.validators');

// hooks 
const {
  isValidTransporter, // check whether the Transporter id valid or not
  checkWhetherItsAValidTransporterUpdate, // check whether the its a valid Transporter update
} = require('../../../hooks');


function transporter() {
  return (open, closed) => {

    // post
    closed.route('/').post(
      [joiTransporter], // joi validation
      // verifyAppToken,
      ctrl.post // controller function 
    );

    // get all 
    closed.route('/').get(          // Transporter List page with pagination
      [joiTransporterList], // joi validation
   //   verifyAppToken,
      ctrl.getListNew // controller function 
    );

    closed.route('/:transporterId/rate-category').get(     // rate-category list by transporterId
     [joiRateCategoryListByTransporterId], // joi validation
      // verifyAppToken,
     isValidTransporter,
      ctrl.getRateCategoryList // controller function 
    );


    closed.route('/:transporterId/model/:modelId/vehicles').get(     
      [JoiGetVehicleByModelId], // joi validation
      // verifyAppToken,
      isValidTransporter,
      ctrl.getVehicleForModel
    );


    // closed.route('/:transporterId').get(      // not required
    //   [joiTransporterGetDetails], // joi validation
    //   // verifyAppToken,
    //   isValidTransporter,
    //   ctrl.getTransporter // controller function 
    // );

    closed.route('/:transporterId/details').get(    
      [joiTransporterGetDetails], // joi validation
      // verifyAppToken,
      isValidTransporter,
      ctrl.getTransporterById // controller function 
    );
    //delete
    closed.route('/:transporterId').delete(         // delete transporter and model mapping
      [joiIdInParams], // joi validation
      isValidTransporter, // get the data from go frugal 
      ctrl.deleteTransporter // get controller 
    );

    // get minified list
    closed.route('/minified/list').get(
      [joiTransporterList], // joi validation
      // verifyUserToken, // verify user token
      ctrl.getMinifiedList // get controller 
    );

    //patch
    closed.route('/:transporterId').patch(     // update transporter
      [joiTransporterPatch], // joi validation
      checkWhetherItsAValidTransporterUpdate,
      ctrl.patchTransporter // get controller 
    );

    // activate or deactive transporter
    closed.route('/:transporterId/status/:type').patch(
      [joiDistributorChangeStatus], // joi validation
      // isDistributorAlreadyActiveOrInactive, // is already active or inactive 
      ctrl.patchTransporterStatus // get controller 
    );

  };

}
module.exports = transporter();
