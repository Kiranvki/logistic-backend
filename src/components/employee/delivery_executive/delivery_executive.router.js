
const ctrl = require('./delivery_executive.controller');

const {
  joiDeliveryList // joi delivery Executive list
} = require('./delivery_executive.validators')

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');


// exporting the user routes 
function deliveryExecutive() {
  return (open, closed) => {
    // get all 
    closed.route('/deliveryExecutive').get(
      [joiDeliveryList], // joi validation
      verifyUserToken,         // verify user token
      ctrl.getList // controller function 
    );

    closed.route('/deliveryExecutive/minified/list').get(
   [joiDeliveryList], // joi validation
      ctrl.getMinifiedList // controller function 
    );
  }
}

module.exports = deliveryExecutive();