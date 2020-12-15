// const ctrl = require('./ratecategory_transporter_mapping.controller');
//  function ratecategoryTransporter() {

// return (open, closed) => {
//     // add the salesorder in the packing stage
//     open.route('/ratecategoryTransporter').post(
//       //[joiTransporter], // joi validation
//       // verifyAppToken,
//       // isValidSalesOrder,
//       ctrl.post // controller function 
//     );
// }
//  }
//  module.exports = ratecategoryTransporter();

const ctrl = require('./ratecategory_transporter_mapping.controller');
// exporting the user routes 
function ratecategoryTransporter() {
    return (open, closed) => {

        open.route('/ratecategoryTransporter').post(
             //[joiVehicle], // joi validation
             // verifyAppToken,
             // isValidSalesOrder,
             ctrl.create // controller function 
           );

        //    open.route('/transporterMasterMapping/:transporterId').get(
        //     //  [transporterMaster], // joi validation
        //     // setupDataForGoFrugalApi, // setup data for gofrugal
        //     // getTheDetailsFromGoFrugal, // get the data from go frugal 
        //     ctrl.getInvoiceDetails // get controller 
        //   );
    
    
        //   open.route('/newVehicle/:newVehicleid').patch(
        //     // [joiGoFrugalSync], // joi validation
        //     // setupDataForGoFrugalApi, // setup data for gofrugal
        //     // getTheDetailsFromGoFrugal, // get the data from go frugal 
        //     ctrl.patchNewVehicle // get controller 
        //   );
    
        //   open.route('/newVehicle/:newVehicleid').delete(
        //     // [joiDeleteTransporeter], // joi validation
        //     // setupDataForGoFrugalApi, // setup data for gofrugal
        //     // getTheDetailsFromGoFrugal, // get the data from go frugal 
        //     ctrl.deleterNewVehicle // get controller 
        //   );
    }
}

module.exports = ratecategoryTransporter();