const ctrl = require('./vehicle_master.controller');
const {
    joivehicle
} = require('./vehicle_master.validators')

function vehicle() {
  return (open, closed) => {
    // add the vehicle in the packing stage
    closed.route('/vehicle').post(
      //[joivehicle], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.post // controller function 
    );

    closed.route('/vehicle').get(
      //  [transporterMaster], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.getVehicle // get controller 
    );

    closed.route('/:vehicleid').get(
        //[joiTransporterCreate], // joi validation
        // verifyAppToken,
        // isValidSalesOrder,
        ctrl.getList // controller function 
      );
  


    closed.route('/:vehicleid').patch(
       //[joiTransporterElementPatch], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.patchVehicle // get controller 
    );

    closed.route('/:vehicleid').delete(
      // [joiDeleteTransporeter], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.deleterVehicle // get controller 
    );
  };

}
module.exports = vehicle();
