const schedule = require('node-schedule');
const cronLogger = require('./cronLogger');
const moment = require('moment');
const {
  error,
  info
} = require('../utils').logging;
const {
  hitCronForAutoCheckoutAppUsers
} = require('../third_party_api/self')

// generating a id 
const guid = () => {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  // getting a 12 digit guid
  for (var i = 0; i < 12; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

// exporting the module 
module.exports = () => {

  // cron for autocheckout users 
  schedule.scheduleJob('0 0 * * *', async () => {
    let requestdId = guid();
    let time = moment().format('DD-MM-YYYY HH:mm')
    info('------------------------');
    info('CRON TAB FOR AUTO CHECKOUT RUNNING STARTED', time);
    cronLogger.info(`CRON-${requestdId} | ${time} | CRON TAB FOR AUTO CHECKOUT RUNNING`);
    let isPricingSynced = await hitCronForAutoCheckoutAppUsers(requestdId);
    if (isPricingSynced.success) {
      cronLogger.info(`CRON-${requestdId} | ${time} | CRON TAB FOR AUTO CHECKOUT RUNNING SUCCESS !`);
      info('CRON TAB FOR AUTO CHECKOUT SUCCESSFULLY FINISHED ', time);
    }
    else {
      cronLogger.error(`CRON-${requestdId} | ${time} | CRON TAB FOR AUTO CHECKOUT RUNNING ERROR !`, JSON.stringify(isPricingSynced.error));
      error('CRON TAB FOR AUTO CHECKOUT ERROR ', time, isPricingSynced.error);
    }
    info('------------------------');
  });
}