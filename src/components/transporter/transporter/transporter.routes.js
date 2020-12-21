const ctrl = require('./transporter.controller');
const {
  joiTransporter,
  joiTransporterElementList,
  joiTransporterElementPatch,
} = require('./transporter.validators');

// hooks 
const {
  isValidTransporter, // check whether the brand manager id valid or not
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
      //[joiTransporterCreate], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.getList // controller function 
    );

    closed.route('/:transporterId').get(
      //[joiTransporterCreate], // joi validation
      // verifyAppToken,
      isValidTransporter,
      ctrl.getTransporter // controller function 
    );

    closed.route('/:transporterId').patch(
       [joiTransporterElementPatch], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.patchTransporter // get controller 
    );

    closed.route('/:transporterId').delete(
      // [joiDeleteTransporeter], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.deleteTransporter // get controller 
    );
  };

}
module.exports = transporter();
