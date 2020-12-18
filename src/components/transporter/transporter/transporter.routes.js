const ctrl = require('./transporter.controller');
const {
  joiTransporter,
  joiTransporterElementList,
  joiTransporterElementPatch,
} = require('./transporter.validators')

function transporter() {
  return (open, closed) => {
    // add the transporter in the packing stage
    closed.route('/transporter').post(
      [joiTransporter], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.post // controller function 
    );
    

    closed.route('/transporter').get(
      //[joiTransporterCreate], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.getList // controller function 
    );


    closed.route('/:transporterid').get(
      //  [transporterMaster], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.getTransporter // get controller 
    );


    closed.route('/:transporterid').patch(
       [joiTransporterElementPatch], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.patchTransporter // get controller 
    );

    closed.route('/:transporterid').delete(
      // [joiDeleteTransporeter], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.deleteTransporter // get controller 
    );
  };

}
module.exports = transporter();
