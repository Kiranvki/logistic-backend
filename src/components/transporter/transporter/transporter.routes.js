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
    closed.route('/').get(
      [joiTransporterList], // joi validation
      // verifyAppToken,
      ctrl.getList // controller function 
    );

    closed.route('/:transporterId').get(
      [joiTransporterGetDetails], // joi validation
      // verifyAppToken,
      isValidTransporter,
      ctrl.getTransporter // controller function 
    );

    //delete
    closed.route('/:transporterId').delete(
      [joiIdInParams], // joi validation
      isValidTransporter, // get the data from go frugal 
      ctrl.deleteTransporter // get controller 
    );

    // get minified list
    closed.route('/vehicleMinified/list').get(
      [joiTransporterList], // joi validation
      // verifyUserToken, // verify user token
      ctrl.getMinifiedList // get controller 
    );

    //patch
    closed.route('/:transporterId').patch(
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
