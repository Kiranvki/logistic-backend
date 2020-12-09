// new vehicle controller 
const ctrl = require('./new_vehicle.controller');


// exporting the user routes 
function newVehicle() {
    return (open, closed) => {

        open.route('/newVehicle').post(
            // [transporterMaster], // joi validation
             // verifyAppToken,
             // isValidSalesOrder,
             ctrl.post // controller function 
           );

           open.route('/newVehicle/:newVehicleid').get(
            //  [transporterMaster], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.getNewVehicle // get controller 
          );
    
    
          open.route('/newVehicle/:newVehicleid').patch(
            // [joiGoFrugalSync], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.patchNewVehicle // get controller 
          );
    
          open.route('/newVehicle/:newVehicleid').delete(
            // [joiDeleteTransporeter], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.deleterNewVehicle // get controller 
          );
    }
}

module.exports = newVehicle();
