
const ctrl = require('./delivery_executive.controller');



// exporting the user routes 
function deliveryExecutive() {
    return (open, closed) => {
  // get all 
  closed.route('/').get(
   // [joiTransporterList], // joi validation
    // verifyAppToken,
    ctrl.getList // controller function 
  );

<<<<<<< HEAD
    //  // activate or deactive security guard
    //  closed.route('/:deliveryId/status/:type').patch(
    //   //[joiDistributorChangeStatus], // joi validation
    //   // isDistributorAlreadyActiveOrInactive, // is already active or inactive 
    //   ctrl.patchDeliveryExecutiveStatus // get controller 
    // );

=======
>>>>>>> d21e31f888bc0b9755a0200ca92ceae329af88c6
    }
}

module.exports = deliveryExecutive();