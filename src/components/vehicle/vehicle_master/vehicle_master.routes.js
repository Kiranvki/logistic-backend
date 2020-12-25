const ctrl = require('./vehicle_master.controller');
const {
  joiVehicleCreate, // create vehicle
  joiVehicleList, //  get vehicle list 
} = require('./vehicle_master.validators')

// hooks 
const {
  isValidTransporter, // check whether the Transporter id valid or not
  checkWhetherItsAValidVehicleUpdate, // check whether the its a valid Vehicle update
} = require('../../../hooks');

function vehicle() {
  return (open, closed) => {

    // post 
    closed.route('/').post(
      [joiVehicleCreate], // joi validation
      //verifyUserToken, // verify user token
      ctrl.post // controller function 
    );

    // get all 
    closed.route('/').get(
      //  [transporterMaster], // joi validation
      //verifyUserToken, // verify user token
      ctrl.getVehicleList // get controller 
    );

    // get minified list
    closed.route('/minified/list').get(
      [joiVehicleList], // joi validation
      //verifyUserToken, // verify user token
      ctrl.getListMinified // get controller 
    );

    closed.route('/:vehicleId').get(
      //[joiTransporterCreate], // joi validation
      //verifyUserToken, // verify user token
      // isValidSalesOrder,
      ctrl.getVehicleDetails // controller function 
    );

    //patch
    closed.route('/:vehicleId').patch(
      //[joiTransporterElementPatch], // joi validation
      //verifyUserToken, // verify user token
      ctrl.patchVehicle // get controller 
    );

    //delete
    closed.route('/:vehicleId').delete(
      // [joiDeleteTransporeter], // joi validation
      //verifyUserToken, // verify user token
      ctrl.deleteVehicle // delete controller 
    );

  };

}
module.exports = vehicle();
