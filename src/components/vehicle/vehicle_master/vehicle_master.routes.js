const ctrl = require('./vehicle_master.controller');
const {
  joiVehicleCreate, // create vehicle
  joiVehicleList, //  get vehicle list 
  joiVehicleGetDetails, // get vehicle details
  joiVehiclePatch, // patch vehicle
  joiIdInParams, // joi vehicle id in params
} = require('./vehicle_master.validators')

// hooks 
const {
  isValidVehicle, // check whether the Vehicle id valid or not
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
      [joiVehicleList], // joi validation
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
      [joiVehicleGetDetails], // joi validation
      //verifyUserToken, // verify user token
      isValidVehicle, // check is valid vehicle id 
      ctrl.getVehicleDetails // controller function 
    );

    //patch
    closed.route('/:vehicleId').patch(
      [joiVehiclePatch], // joi validation
      //verifyUserToken, // verify user token
      checkWhetherItsAValidVehicleUpdate,  // check whether its a valid update 
      ctrl.patchVehicle // get controller 
    );

    //delete
    closed.route('/:vehicleId').delete(
      [joiIdInParams], // joi validation
      //verifyUserToken, // verify user token
      isValidVehicle, // check is valid vehicle id 
      ctrl.deleteVehicle // delete controller 
    );

  };
}
module.exports = vehicle();
