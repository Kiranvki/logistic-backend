// Controller
const request = require('superagent');

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (url, city) => {
  try {
    info(`Getting Customer Account base from Tally for city ${city}!`);
    // hit the tally ERP api and get the documents
    return request.get(url)
      .timeout({
        response: 1200000, // Wait 20 mins for the server to start sending,
        deadline: 1200000, // but allow 20 minute for the file to finish loading.
      })
      .retry(1)
      .then((res) => {
        // checking whether the user is authentic
        // if (res.status === 200 && res.body && res.body.eCustomers && Array.isArray(res.body.eCustomers)) {
        //   return {
        //     success: true,
        //     data: res.body.eCustomers,
        //     currentPage: res.body.current_page,
        //     totalPages: res.body.total_pages
        //   };
        // } else {
        //   return {
        //     success: false
        //   };
        // }
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