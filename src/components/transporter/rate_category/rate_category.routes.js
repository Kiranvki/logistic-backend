const ctrl = require('./rate_category.controller'); 


  // exporting the user routes 
  function rateCategory() {
    return (open, closed) => {
      // add the salesorder in the packing stage
      open.route('/rateCategory').post(
          // verifyAppToken,
          // isValidSalesOrder,
          ctrl.post // controller function 
        );

        open.route('/rateCategory/:ratecategoryid').get(
            // verifyAppToken,
            // isValidSalesOrder,
            ctrl.getRateCategory // controller function 
          );

          open.route('/rateCategory/:ratecategoryid').patch(
            // verifyAppToken,
            // isValidSalesOrder,
            ctrl.patchRateCategory // controller function 
          );

          open.route('/rateCategory/:ratecategoryid').delete(
            // verifyAppToken,
            // isValidSalesOrder,
            ctrl.deleterateCategory // controller function 
          );
    };
    
  }
  
  
  module.exports = rateCategory();