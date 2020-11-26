// user controller 
const ctrl = require('./picker_boy.controller');

// custom joi validation
const {
  joiPickerBoyGetDetails, // get the saleman details 
  joiIdInParams, // check joi id in params
  joiSalesmanList, // get salesman list
  joiSalesmanPatch, // patch salesman
  joiSalesmanReport, // get salesman Report
  joiSalesmanCreate, // create a new salesman

  joiSalesmanChangeStatus, // salesman status change
  joiSalesmanReportDetails, // salesman report details 
  joiSalesmanListForFilter,  // joi salesman filter list 
  joiSalesmanAsmBulkMapping, // joi salesman asm bulk mapping 
  joiSalesmanReportDownload, // joi salesman report download
  joiSalesmanOnboardedCustomersList, // joi get salesman onboarded customers 
} = require('./picker_boy.validators');

// hooks 
//const {
// isValidAgencyId, // is valid agency id or not 

// getDetailsFromZoho, // get details from zoho
// checkWhetherTheAsmIsMapped, // check whether the asm is mapped is valid or not 
// getValidAndActiveSalesmanId, // get valid and active salesman id 
// checkIsSalesmanAlreadyCreated, // check whether the salesman is already created or not 
// checkIfAsmCreatedForTheSameUser, // check if asm is created for the same user 
// getSalesmanOnBoardedCustomersList, // get the list of onboarded customers 
// checkWhetherValidAsmAndSalesmanId, // check whether asm and salesman id
// isSalesmanAlreadyActiveOrInactive, // is salesman already active or inactive
// checkWhetherItsAValidSalesmanUpdate, // check whether the update is valid or not 
// getAdoptionMetricDetailsForInternalForASalesman, // get the adoption metrics details for the internal salesman 
//} = require('../../../../hooks');

// app hooks 
const {
  // getAdoptionMetricDetailsForInternal, // get adoption details 
  isValidPickerBoy, // get the PickerBoy details 
} = require('../../../hooks/app');

const {
  verifyAppToken
} = require('../../../hooks/app/Auth');

// exporting the user routes 
function userRoutes() {
  //open, closed
  return (open, closed) => {
    // closed
    // post 

    // get pickerboy details
    closed.route('/picker-boy/:pickerBoyId').get(
      [joiPickerBoyGetDetails], // joi validation
      verifyAppToken, // verify user token
      isValidPickerBoy, // check is valid asm id 
      ctrl.getPickerBoyDetails // get controller 
    );

    /*
    closed.route('/salesman').post(
      [joiSalesmanCreate], // joi validation
      verifyUserToken, // verify user token
      checkIfAsmCreatedForTheSameUser, // check whether asm is already created for the given user
      checkIsSalesmanAlreadyCreated, // check if asm is already created
      isValidAgencyId, // check whether the agency id is valid or not
      checkWhetherTheAsmIsMapped, // check whether the asm is mapped 
      getDetailsFromZoho, // get details from zoho
      ctrl.post // controller function
    );

    // get salesman list
    closed.route('/salesman').get(
      [joiSalesmanList], // joi validation
      verifyUserToken, // verify user token
      ctrl.getList // controller function
    );

  

    // activate or deactivate status change
    closed.route('/salesman/:salesmanId/status/:type').patch(
      [joiSalesmanChangeStatus], // joi validation
      verifyUserToken, // verify user token
      isSalesmanAlreadyActiveOrInactive, // is already active or inactive 
      ctrl.patchSalesmanStatus // get controller 
    );

    // delete salesman  
    closed.route('/salesman/:salesmanId').delete(
      [joiIdInParams], // joi validation
      verifyUserToken, // verify user token
      isValidSalesman, // check is valid salesman id 
      ctrl.deleteSalesman // get controller 
    );

    // delete salesman  
    closed.route('/salesman/:salesmanId').patch(
      [joiSalesmanPatch], // joi validation
      verifyUserToken, // verify user token
      isValidSalesman, // check is valid salesman id 
      checkWhetherTheAsmIsMapped, // check whether the asm is valid 
      checkWhetherItsAValidSalesmanUpdate, // check whether its a valid update 
      ctrl.patchSalesman // get controller 
    );

    // update bulk salesman to a asm
    closed.route('/salesman/bulk/asm-mapping').patch(
      [joiSalesmanAsmBulkMapping], // joi salesman asm mapping bulk
      verifyUserToken, // verify user token
      checkWhetherValidAsmAndSalesmanId, // check whether the asm and salesman ids are valid
      ctrl.patchSalesmanAsmBulkMappingUpdate // patch the bulk salesman with asm
    )

    // get salesman list
    closed.route('/salesman/minified/list').get(
      [joiSalesmanList], // joi validation
      verifyUserToken, // verify user token
      getValidAndActiveSalesmanId, // get valid and active salesman id 
      ctrl.getListMinified // controller function
    );

    // get salesman list for filters 
    closed.route('/salesman/filter/list').get(
      [joiSalesmanListForFilter], // joi validation
      verifyUserToken, // verify user token
      getValidAndActiveSalesmanId, // get valid and active salesman id 
      ctrl.getListForFilter // controller function
    );

    // get the list of onboarded customers 
    closed.route('/salesman/:salesmanId/onbaorded-customers/list').get(
      [joiSalesmanOnboardedCustomersList], // joi validation
      verifyUserToken, // verify user token
      isValidSalesman, // check is valid salesman id 
      getSalesmanOnBoardedCustomersList, // get the onboarded customers list 
      ctrl.getTheListOfOnBoardedCustomers // controller function
    );

    // get customer details for data 
    closed.route('/salesman/report/date-wise').post(
      [joiSalesmanReport], // joi validation
      verifyUserToken, // verify app user token
      getAdoptionMetricDetailsForInternal, // get adoption metrics details
      ctrl.getSalesmanMetrics, // controller function
    );

    // get customer full details for each salesman  
    closed.route('/salesman/:salesmanId/report/date-wise').post(
      [joiSalesmanReportDetails], // joi validation
      verifyUserToken, // verify app user token
      getAdoptionMetricDetailsForInternalForASalesman, // get adoption metrics details
      ctrl.getSalesmanMetricsDetails, // controller function
    );

    // download csv
    closed.route('/salesman/report/date-wise/download').post(
      [joiSalesmanReportDownload], // joi validation
      verifyUserToken, // verify app user token
      getAdoptionMetricDetailsForInternal, // get adoption metrics details
      ctrl.downloadSalesmanMetrics, // controller function
    );
    */
  };
}

module.exports = userRoutes();
