// Controller
const request = require('superagent');
const cronLogger = require('../../utils/cronLogger');
// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

const city = ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore'];
const customerOtherDetails = ['payment', 'invoice', 'debit', 'credit']

// exporting the hooks 
module.exports = async (requestdId) => {
  try {
    info(`Getting Customer Account base from Tally for city !`);

    // getting the url 
    let baseUrl = process.env.baseUrl,
      port = process.env.port,
      apiToSyncCustomerOthersDetails = process.env.apiToSyncCustomerOthersDetails;

    for (let i = 0; i < city.length; i++) {
      for (let j = 0; j < customerOtherDetails.length; j++) {
        cronLogger.info(`CRON-${requestdId} | ${new Date()} | CITY - ${city[i]} | TYPE - ${customerOtherDetails[j]} !`);
        info(`HITTING SERVER FOR ${city[i]} for city ${customerOtherDetails[j]}`)
        // hit the tally ERP api and get the documents
        await request.get(`${baseUrl}:${port}${apiToSyncCustomerOthersDetails}${customerOtherDetails[j]}/city/${city[i]}`)
          .then((res) => {
            cronLogger.info(`CRON-${requestdId} | ${new Date()} | CITY - ${city[i]} | TYPE - ${customerOtherDetails[j]} | SUCCESSFULL !`);
            return { success: true, data: res.body };
            // catch any runtime error
          }, (err) => {
            error(err.body);
            cronLogger.error(`CRON-${requestdId} | ${new Date()} | CITY - ${city[i]} | TYPE - ${customerOtherDetails[j]} | ERROR ${JSON.stringify(err.body)}!`);
            if (err.timeout) {
              return {
                success: false,
                error: 'API timeout'
              };
            } else {
              cronLogger.error(`CRON-${requestdId} | ${new Date()} | CITY - ${city[i]} | TYPE - ${customerOtherDetails[j]} | ERROR SERVER RESPONDED WITH ERROR CODE !`);
              return {
                success: false,
                error: err
              };
            }
          });
      }
    }

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