// Controller
const request = require('superagent');

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (city) => {
  try {
    info(`Getting Customer Account base from Tally for city !`);

    // getting the url 
    let baseUrl = process.env.baseUrl,
      port = process.env.port,
      apiToSyncTallyCustomerAccounts = process.env.apiToSyncTallyCustomerAccounts;

    info(`HITTING SERVER FOR ${city} for Customer Accounts Sync !`);

    // getting the url 
    let url = `${baseUrl}:${port}${apiToSyncTallyCustomerAccounts}/${city}`;

    console.log('The url her eis ---> ', url);

    // hit the tally ERP api and get the documents
    await request.get(url)
      .timeout({
        response: 99999, // Wait mins for the server to start sending,
        deadline: 99999, // but allow  minute for the file to finish loading.
      })
      .then((res) => {
        return { success: true, data: res.body };
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

    // return 
    return {
      success: true
    };

    // catch any runtime error 
  } catch (e) {
    error(e);
    return {
      success: false,
      error: e
    };
  }
};