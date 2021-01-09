
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

    }
}

module.exports = deliveryExecutive();