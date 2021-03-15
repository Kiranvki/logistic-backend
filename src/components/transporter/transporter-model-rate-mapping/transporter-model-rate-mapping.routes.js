const ctrl = require('./transporter-model-rate-mapping.controller')


const {
  getModelByTransporterId
  } = require('./transporter-model-rate-mapping.validator')

  // auth 
const {
    verifyUserToken
  } = require('../../../hooks/Auth');


function transporterVehicleModelRCModel(){
return (open,closed)=>{
       closed.route('/transcporter-models-rate-category/details').get(   // not required
        [getModelByTransporterId],
        verifyUserToken, // verify user token
        ctrl.getModelByTransporterId
        )
   }

}

module.exports = transporterVehicleModelRCModel();
