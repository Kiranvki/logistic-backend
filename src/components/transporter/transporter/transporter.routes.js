const ctrl = require('./transporter.controller');
const {
  joiTransporter,
  joiTransporterGetDetails,
  joiTransporterList,
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
      //[joiTransporterGetDetails], // joi validation
      // verifyAppToken,
      isValidTransporter,
      ctrl.getTransporter // controller function 
    );

    closed.route('/:transporterId').patch(
       //[joiTransporterElementPatch], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      isValidTransporter, // check whether its a valid update 
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
