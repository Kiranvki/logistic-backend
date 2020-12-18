//rate category controller
const ctrl = require('./rate_category.controller');

  // exporting the rate category routes 
function ratecategory(){
    return (open, closed)=>{
    // add the rate category controller in the packing stage 
    closed.route('/ratecategory').post(
        //[joiTransporterCreate], // joi validation
        // verifyAppToken,
        // isValidSalesOrder,
        ctrl.post // controller function 
      );

      closed.route('/ratecategory').get(
        //[joiTransporterCreate], // joi validation
        // verifyAppToken,
        // isValidSalesOrder,
        ctrl.getList // controller function 
      );


      closed.route('/:ratecategoryId').get(
        //[joiTransporterMaster], // joi validation
        // setupDataForGoFrugalApi, // setup data for gofrugal
        // getTheDetailsFromGoFrugal, // get the data from go frugal 
        ctrl.getRateCategory // get controller 
      );


      closed.route('/:ratecategoryId').patch(
        //[joiTransporterMaster], // joi validation
        // setupDataForGoFrugalApi, // setup data for gofrugal
        // getTheDetailsFromGoFrugal, // get the data from go frugal 
        ctrl.patchtRateCategory // get controller 
      );

      closed.route('/:ratecategoryId').delete(
        // [joiDeleteTransporeter], // joi validation
        // setupDataForGoFrugalApi, // setup data for gofrugal
        // getTheDetailsFromGoFrugal, // get the data from go frugal 
        ctrl.deleteRateCategory // get controller 
      );

    }
}




module.exports = ratecategory();