const ctrl = require('./transporter.controller');
const {
  joiTransporter,
  joiTransporterElementList,
  joiTransporterElementPatch,
} = require('./transporter.validators')

function transporter() {
  return (open, closed) => {
    // add the salesorder in the packing stage
    open.route('/transporter').post(
      [joiTransporter], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.post // controller function 
    );
    

    // get all 
    open.route('/transporter').get(
      [joiTransporterElementList], // joi validation
      ctrl.getList // get controller 
    );

    open.route('/transporter/:transporterid').get(
      //  [transporterMaster], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.getTransporter // get controller 
    );


    open.route('/transporter/:transporterid').patch(
       [joiTransporterElementPatch], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.patchTransporter // get controller 
    );

    open.route('/transporter/:transporterid').delete(
      // [joiDeleteTransporeter], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.deleteTransporter // get controller 
    );
  };

}
module.exports = transporter();
