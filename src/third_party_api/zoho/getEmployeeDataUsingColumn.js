// Controller
// const request = require('superagent');
const request = require('../../utils/request');
const moment = require('moment');

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (searchValue, searchColumn = 'EMPLOYEEID') => {
  try {
    info(`Searching zoho db using ${searchColumn} for value ${searchValue} !`);
    let url = `${process.env.zohoBaseUrl}${process.env.zohoGetDetailsBasedOnColumnName}`;

    // check whether the document type already exist or not 
    return request.get(url)
      .set('Content-Type', 'application/json')
      .set('accept', 'application/json')
      .query({ 'authtoken': process.env.zohoAuthtoken })
      .query({ 'searchColumn': searchColumn })
      .query({ 'searchValue': searchValue })
      .timeout({
        response: 50000, // Wait 10 seconds for the server to start sending,
        deadline: 60000, // but allow 1 minute for the file to finish loading.
      })
      .retry(2)
      .then((res) => {
        // checking whether the user is authentic
        if (res.status === 200 && res.body && res.body.response && res.body.response.result) {
          return {
            success: true,
            data: res.body.response.result
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
