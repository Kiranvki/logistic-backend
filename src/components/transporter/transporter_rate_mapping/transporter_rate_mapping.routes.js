//transporterRatecategory Controller
const ctrl = require('./transporter_rate_mapping.controller');

// exporting the transporterRatecategory routes
function transporterRatecategory(){
    return (open, closed)=>{
        closed.route('/transporterRate').post(
           // [joiTransporter], // joi validation
            // verifyAppToken,
            // isValidSalesOrder,
            ctrl.post // controller function 
          );

            // get all 
    closed.route('/transporterRate').get(
        //[joRoleList], // joi validation
        // verifyUserToken, // verify user token
        ctrl.getList // get controller 
      );
    }
}
module.exports = transporterRatecategory();