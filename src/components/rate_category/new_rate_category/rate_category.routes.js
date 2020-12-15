//rate category controller
const ctrl = require('./rate_category.controller');

  // exporting the user routes 
function ratecategory(){
    return (open, closed)=>{
    // add the transporterMaster in the packing stage 
    open.route('/ratecategory').post(
        //[joiTransporterCreate], // joi validation
        // verifyAppToken,
        // isValidSalesOrder,
        ctrl.post // controller function 
      );

      open.route('/ratecategory/:ratecategoryId').get(
        //[joiTransporterMaster], // joi validation
        // setupDataForGoFrugalApi, // setup data for gofrugal
        // getTheDetailsFromGoFrugal, // get the data from go frugal 
        ctrl.getRateCategory // get controller 
      );


    }
}




module.exports = ratecategory();