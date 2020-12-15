// new vehicle controller 
const ctrl = require('./transporter_master.controller');
const {
  joiVehicle
} =  require('./transporter_master.validators')

// exporting the user routes 
function vehicleMaster() {
    return (open, closed) => {

        closed.route('/transporterVehicle').post(
             [joiVehicle], // joi validation
             // verifyAppToken,
             // isValidSalesOrder,
             ctrl.post // controller function 
           );

           closed.route('/transporterVehicle/:transporterVehiclerid').get(
            //  [transporterMaster], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.getNewVehicle // get controller 
          );
    
    
          closed.route('/transporterVehicle/:transporterVehicleid').patch(
            // [joiGoFrugalSync], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.patchNewVehicle // get controller 
          );
    
          closed.route('/transporterVehicle/:transporterVehiclerid').delete(
            // [joiDeleteTransporeter], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.deleterNewVehicle // get controller 
          );
    }
}

module.exports = vehicleMaster();
