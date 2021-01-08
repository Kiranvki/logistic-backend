
const ctrl = require('./delivery_executive.controller');



// exporting the user routes 
function deliveryExecutive() {
    return (open, closed) => {
  // get all 
  closed.route('/list/deliveryexecutive').get(
   // [joiTransporterList], // joi validation
    // verifyAppToken,
    ctrl.getList // controller function 
  );

    // activate or deactive security guard
    closed.route('/:deliveryexecutiveId/status/:type').patch(
      //[joiDistributorChangeStatus], // joi validation
      // isDistributorAlreadyActiveOrInactive, // is already active or inactive 
      ctrl.patchDeliveryExecutiveStatus // get controller 
    );
    

    }
}

module.exports = deliveryExecutive();