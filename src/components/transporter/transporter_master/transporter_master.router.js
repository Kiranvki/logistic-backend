// transporter_master controller 
const ctrl = require('./transporter_master.controller'); 

const {
  joiTransporterCreate, // joi token validation 
  joiTransporterMaster,
  joiIdInParams 

} = require('./transporter_master.validators')
 
 // login 
//   open.route('/transporterMaster').post(
//     [joiLogInValidate], // joi validation
//     isEmailExist, // check whether the email exist  
//     checkUserPassword, // check whether the user password is correct or not
//     generateAdminToken, // generate the admin token  
//     ctrl.login // controller function
//   );


  // exporting the user routes 
function transporterMaster() {
  return (open, closed) => {
    // add the transporterMaster in the packing stage
    open.route('/transporterMaster').post(
        [joiTransporterCreate], // joi validation
        // verifyAppToken,
        // isValidSalesOrder,
        ctrl.post // controller function 
      );

      open.route('/transporterMaster/:transporterid').get(
        [joiTransporterMaster], // joi validation
        // setupDataForGoFrugalApi, // setup data for gofrugal
        // getTheDetailsFromGoFrugal, // get the data from go frugal 
        ctrl.getTransporterMaster // get controller 
      );


      open.route('/transporterMaster/:transporterid').patch(
         [joiTransporterMaster], // joi validation
        // setupDataForGoFrugalApi, // setup data for gofrugal
        // getTheDetailsFromGoFrugal, // get the data from go frugal 
        ctrl.patchTransporterStatus // get controller 
      );

      open.route('/transporterMaster/:transporterid').delete(
         [joiIdInParams], // joi validation
        // setupDataForGoFrugalApi, // setup data for gofrugal
        // getTheDetailsFromGoFrugal, // get the data from go frugal 
        ctrl.deleteTransporter // get controller 
      );
  };

  
}


module.exports = transporterMaster();

