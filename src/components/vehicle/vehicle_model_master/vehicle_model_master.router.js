const ctrl = require('./vehicle_model_master.controller')


const {
  joiVehicleModelCreate,
  JoiGetVehilceModelList,
  JoiGetVehilceModelByTransporterId,
  JoiGetVehicleByModelId
  } = require('./vehicle_model_master.validator')

  // auth 
const {
    verifyUserToken
  } = require('../../../hooks/Auth');


function vehicleModel(){
return (open,closed)=>{
   closed.route('/vehicle-model').post(     // create Model
       [joiVehicleModelCreate], // joi validation
      verifyUserToken, // verify user token
       ctrl.createVehicleModel
       )

    closed.route('/vehicle-model/details').get(
      [JoiGetVehilceModelList],
      verifyUserToken, // verify user token
        ctrl.getVehicleModel
        )
    

    closed.route('/vehicle-model/rate-category/minified/details').get(
       verifyUserToken, // verify user token
        ctrl.getMinifiedVehicleModelAndRC
        )

    closed.route('/vehicle-model/:transporterId').get(
      [JoiGetVehilceModelByTransporterId],
      verifyUserToken, // verify user token
      ctrl.getVehicleModelByTransportId
      )
   }

}

module.exports = vehicleModel();
