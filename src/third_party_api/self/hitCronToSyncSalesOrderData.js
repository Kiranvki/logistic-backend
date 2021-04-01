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
    info(`Sync sales order from master!`);

    // getting the url 
    let baseUrl = process.env.WAYCOOL_SAP_UAT_BASE_URL,
      salseOrderFormMasterEndpoint = process.env.SALES_ORDER_GET_ENDPOINT;

    // hit the API to sync data from master to Salse order
    return request.get(`${baseUrl}${salseOrderFormMasterEndpoint}`)
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