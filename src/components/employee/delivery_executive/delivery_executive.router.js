
const ctrl = require('./delivery_executive.controller');

const {
  joiDeliveryList // joi delivery Executive list
} = require('./delivery_executive.validators')

// exporting the user routes 
function deliveryExecutive() {
  return (open, closed) => {
    // get all 
    closed.route('/list/deliveryExecutive').get(
      // [joiTransporterList], // joi validation
      // verifyAppToken,
      ctrl.getList // controller function 
    );



  }
}

module.exports = deliveryExecutive();