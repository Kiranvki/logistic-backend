// new vehicle controller 
const ctrl = require('./transporter_master.controller');
const {
  joiVehicle
} =  require('./transporter_master.validators')

// exporting the user routes 
function vehicleMaster() {
    return (open, closed) => {

        open.route('/transporterMaster').post(
             [joiVehicle], // joi validation
             // verifyAppToken,
             // isValidSalesOrder,
             ctrl.post // controller function 
           );

           open.route('/transporterMaster/:transporterMasterid').get(
            //  [transporterMaster], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.getNewVehicle // get controller 
          );
    
    
          open.route('/transporterMaster/:transporterMasterid').patch(
            // [joiGoFrugalSync], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.patchNewVehicle // get controller 
          );
    
          open.route('/transporterMaster/:transporterMasterid').delete(
            // [joiDeleteTransporeter], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.deleterNewVehicle // get controller 
          );
    }
}

module.exports = vehicleMaster();
