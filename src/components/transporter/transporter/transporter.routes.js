const ctrl = require('./transporter.controller');
const {
  // joiTransporterGetDetails,/
  joiTransporter,
  joiTransporterList,
  joiTransporterGetDetails,
  joiTransporterPatch,
  joiIdInParams,
  joiTransporterElementPatch,
} = require('./transporter.validators');

// hooks 
const {
  isValidTransporter, // check whether the Transporter id valid or not
  checkWhetherItsAValidTransporterUpdate, // check whether the its a valid Transporter update
} = require('../../../hooks');


function transporter() {
  return (open, closed) => {
    // add the transporter in the packing stage
    closed.route('/').post(
      [joiTransporter], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.post // controller function 
    );


    closed.route('/').get(
      [joiTransporterList], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.getList // controller function 
    );

    closed.route('/:transporterId').get(
      [joiTransporterGetDetails], // joi validation
      // verifyAppToken,
      isValidTransporter,
      ctrl.getTransporter // controller function 
    );

       //
       closed.route('/:transporterId').delete(
        [joiIdInParams], // joi validation
       // setupDataForGoFrugalApi, // setup data for gofrugal
       isValidTransporter, // get the data from go frugal 
       ctrl.deleteTransporter // get controller 
     );
    // get minified list
    closed.route('/minified/list').get(
      // [joiCustomersList], // joi validation
      // verifyUserToken, // verify user token
      ctrl.getMinifiedList // get controller 
    );

    //
    closed.route('/:transporterId').patch(
      [joiTransporterPatch], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      //isValidTransporter, // check whether its a valid update 
      ctrl.patchTransporter // get controller 
    );

       // activate or deactive transporter
       closed.route('/:transporterId/status/:type').patch(
        // [joiDistributorChangeStatus], // joi validation
        // isDistributorAlreadyActiveOrInactive, // is already active or inactive 
        ctrl.patchTransporterStatus // get controller 
      );

    // //
    // closed.route('/:transporterId').delete(
    //    [joiIdInParams], // joi validation
    //   // setupDataForGoFrugalApi, // setup data for gofrugal
    //   isValidTransporter, // get the data from go frugal 
    //   ctrl.deleteTransporter // get controller 
    // );
  };

}
module.exports = transporter();
