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

    // getting the url 
    let baseUrl = process.env.baseUrl,
      port = process.env.port,
      apiToPublishBeatPlan = process.env.apiToPublishBeatPlan;

    // hit the tally ERP api and get the documents
    return request.get(`${baseUrl}:${port}${apiToPublishBeatPlan}`)
      .timeout({
        response: 99999, // Wait mins for the server to start sending,
        deadline: 99999, // but allow  minute for the file to finish loading.
      })
      .retry(1)
      .then((res) => {
        return { success: true, data: res.body };
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