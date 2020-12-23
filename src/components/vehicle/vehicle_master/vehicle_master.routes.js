const ctrl = require('./vehicle_master.controller');
const {
  joiVehicleCreate, // create vehicle
  joiVehicleList, //  get vehicle list 
} = require('./vehicle_master.validators')

function vehicle() {
  return (open, closed) => {

    // post 
    closed.route('/').post(
      [joiVehicleCreate], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.post // controller function 
    );

    // get all 
    closed.route('/').get(
      //  [transporterMaster], // joi validation
      ctrl.getVehicleList // get controller 
    );

    // get minified list
    closed.route('/minified/list').get(
      [joiVehicleList], // joi validation
      ctrl.getListMinified // get controller 
    );



    closed.route('/:vehicleId').get(
      //[joiTransporterCreate], // joi validation
      // verifyAppToken,
      // isValidSalesOrder,
      ctrl.getDetails // controller function 
    );



    closed.route('/:vehicleId').patch(
      //[joiTransporterElementPatch], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.patchVehicle // get controller 
    );

    closed.route('/:vehicleId').delete(
      // [joiDeleteTransporeter], // joi validation
      // setupDataForGoFrugalApi, // setup data for gofrugal
      // getTheDetailsFromGoFrugal, // get the data from go frugal 
      ctrl.deleteVehicle // get controller 
    );
  };

}
module.exports = vehicle();
