const ctrl = require('./new_transporter.controller'); 

function newTransporter() {
    return (open, closed) => {
        // add the salesorder in the packing stage
        open.route('/newTransporter').post(
            // [transporterMaster], // joi validation
             // verifyAppToken,
             // isValidSalesOrder,
             ctrl.post // controller function 
           );

           open.route('/newTransporter/:newtransporterid').get(
            //  [transporterMaster], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.getnewTransporter // get controller 
          );

          
      open.route('/newTransporter/:newtransporterid').patch(
        // [joiGoFrugalSync], // joi validation
        // setupDataForGoFrugalApi, // setup data for gofrugal
        // getTheDetailsFromGoFrugal, // get the data from go frugal 
        ctrl.patchNewTransporter // get controller 
      );

      open.route('/newTransporter/:newtransporterid').delete(
        // [joiDeleteTransporeter], // joi validation
        // setupDataForGoFrugalApi, // setup data for gofrugal
        // getTheDetailsFromGoFrugal, // get the data from go frugal 
        ctrl.deleteNewTransporter // get controller 
      );
  };
    
}
module.exports = newTransporter();
