// Controller
const request = require('superagent');

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (url, city, fromDate, toDate) => {
  try {
    info(`Getting Customer Payment base from Tally for city ${city}!`);

    // generating the url 
    url = `${url}?Fromdate="${fromDate}"&Todate="${toDate}"`;
    console.log('The url here is --> ', url);
    // hit the tally ERP api and get the documents
    return request.get(url)
      .buffer(true)
      .timeout({
        response: 1200000, // Wait 20 mins for the server to start sending,
        deadline: 1200000, // but allow 20 minute for the file to finish loading.
      })
      .then((res) => {
        // checking whether the user is authentic
        if (res.status === 200 && res.body) {
          if (res.body !== '') {
            let csvData = (res.body).toString('utf-8');
            return {
              success: true,
              data: csvData
            };
          } else {
            success: false
          }
        } else {
          return {
            success: false
          };
        }
        // catch any runtime error
      }, (err) => {
        error(err.body);
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