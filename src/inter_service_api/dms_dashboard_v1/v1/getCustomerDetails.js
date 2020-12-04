// Controller
const request = require('../../../utils/request');

// Responses & others utils 
const {
  error,
  info
} = require('../../../utils').logging;

// exporting the hooks 
module.exports = async (customerId, cityId) => {
  try {
    info(`Hitting the DMS V1 server to get the customer details!`);

    // getting the data from the env
    let dmsV1BaseUrl = process.env.dmsV1BaseUrl;
    let dmsGetCustomerDetails = process.env.dmsV1GetCustomerDetailsOne + customerId + process.env.dmsV1GetCustomerDetailsTwo + cityId;

    let url = dmsV1BaseUrl + dmsGetCustomerDetails; // DMS url

    // check whether the document type already exist or not 
    return request.get(url)
      .timeout({
        response: 5000, // Wait 10 seconds for the server to start sending,
        deadline: 5000, // but allow 1 minute for the file to finish loading.
      })
      .retry(1)
      .then((res) => {
        // checking whether the user is authentic
        if (res.status === 200) {
          info('Data Fetched Successfully !');
          return {
            success: true,
            data: res.body.data,
          };
        } else {
          return {
            success: false
          };
        }
        // catch any runtime error
      }, (err) => {
        // error(err);
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