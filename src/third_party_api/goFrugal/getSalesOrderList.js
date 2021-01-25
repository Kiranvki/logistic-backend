// Controller
const request = require('../../utils/request');

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (url, authToken, city, page, startDate, endDate) => {
  try {
    info(`Getting Sales Order  from GoFrugal ${city} for page ${page}!`);


    // check whether the document type already exist or not 
    return request.get(url + '?q=createdAt>=' + startDate + ',createdAt<=' + endDate + '&page=' + page)
      .set('Content-Type', 'application/json')
      .set('accept', 'application/json')
      .set('x-auth-token', authToken)
      .timeout({
        response: 60000, // Wait 10 seconds for the server to start sending,
        deadline: 60000, // but allow 1 minute for the file to finish loading.
      })
      .retry(1)
      .then((res) => {
        // checking whether the user is authentic
        if (res.status === 200 && res.body && res.body.salesOrders && Array.isArray(res.body.salesOrders)) {
          return {
            success: true,
            data: res.body.salesOrders,
            currentPage: res.body.current_page,
            totalPages: res.body.total_pages
          };
        } else {
          return {
            success: false
          };
        }
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
