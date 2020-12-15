const ctrl = require('./transporter_master_mapping.controller');
// exporting the user routes 
function vehicleMasteMapping() {
    return (open, closed) => {

        open.route('/transporterMasterMapping').post(
             //[joiVehicle], // joi validation
             // verifyAppToken,
             // isValidSalesOrder,
             ctrl.create // controller function 
           );

           open.route('/transporterMasterMapping/:transporterId').get(
            //  [transporterMaster], // joi validation
            // setupDataForGoFrugalApi, // setup data for gofrugal
            // getTheDetailsFromGoFrugal, // get the data from go frugal 
            ctrl.getInvoiceDetails // get controller 
          );
    
    
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

module.exports = vehicleMasteMapping();