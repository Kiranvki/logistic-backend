const schedule = require('node-schedule');
const cronLogger = require('./cronLogger');
const moment = require('moment');
const {
  error,
  info
} = require('../utils').logging;
const {
  hitCronToSyncCustomerOthersDetails,
  hitCronToGeneratePublishedBeatPlans,
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
  // saturday at 2300 hrs 
  schedule.scheduleJob('0 17 * * SAT', async () => {
    // schedule.scheduleJob('* * * * *', async () => {
    let requestdId = guid();
    let time = moment().format('DD-MM-YYYY HH:mm')
    info('------------------------');
    info('CRON TAB RUNNING STARTED', time);
    cronLogger.info(`CRON-${requestdId} | ${time} | STARTED FOR GENERATE PUBLISHED BEAT PLAN`);
    let isPublished = await hitCronToGeneratePublishedBeatPlans();
    if (isPublished.success) {
      cronLogger.info(`CRON-${requestdId} | ${time} | COMPLETED SUCCESSFULLY - `, JSON.stringify(isPublished.data));
      info('CRON TAB SUCCESSFULLY FINISHED ', time);
    } else {
      cronLogger.error(`CRON-${requestdId} | ${time} | ERROR - `, JSON.stringify(isPublished.error));
      error('CRON TAB ERROR ', time, isPublished.error);
    }
    info('------------------------');
  });

  // cron for syncing customer other details 
  schedule.scheduleJob('0 5 * * *', async () => {
    // schedule.scheduleJob('* * * * *', async () => {
    let requestdId = guid();
    let time = moment().format('DD-MM-YYYY HH:mm')
    info('------------------------');
    info('CRON TAB FOR CUSTOMER SYNC RUNNING STARTED', time);
    cronLogger.info(`CRON-${requestdId} | ${time} | CRON TAB FOR CUSTOMER SYNC RUNNING`);
    let isPublished = await hitCronToSyncCustomerOthersDetails(requestdId);
    if (isPublished.success) {
      cronLogger.info(`CRON-${requestdId} | ${time} | CRON TAB FOR CUSTOMER SYNC RUNNING SUCCESS !`);
      info('CRON TAB FOR CUSTOMER SYNC SUCCESSFULLY FINISHED ', time);
    }
    else {
      cronLogger.error(`CRON-${requestdId} | ${time} | CRON TAB FOR CUSTOMER SYNC RUNNING ERROR !`, JSON.stringify(isPublished.error));
      error('CRON TAB FOR CUSTOMER SYNC ERROR ', time, isPublished.error);
    }
    info('------------------------');
  });
}