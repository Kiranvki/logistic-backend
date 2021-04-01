// Controller
const request = require('superagent');

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (reqId) => {
  try {
    info(`Sync purchase order from master!`);

    // getting the url 
    let baseUrl = process.env.WAYCOOL_SAP_UAT_BASE_URL,
      purchaseOrderFromMasterEndpoint = process.env.PURCHASE_ORDER_END_POINT;

    // hit the API to sync data from master to Purchase order
    return request.get(`${baseUrl}${purchaseOrderFromMasterEndpoint}`)
      .timeout({
        response: 99999, // Wait mins for the server to start sending,
        deadline: 99999, // but allow  minute for the file to finish loading.
      })
      .retry(1)
      .then((res) => {
        return { success: true, data: res.text };
        // catch any runtime error
      }, (err) => {
        error(err);
        if (err.timeout) {
          return {
            success: false,
            error: 'API timeout'
          };
        } else {
          return {
            success: false,
            error: err
          };
        }
      });
    // catch any runtime error 
  } catch (e) {
    error(e);
    return {
      success: false,
      error: e
    };
  }
};