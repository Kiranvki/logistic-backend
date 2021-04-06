const cluster = require('cluster');
const schedule = require('node-schedule');
const cronLogger = require('./cronLogger');
const moment = require('moment');
const {
  error,
  info
} = require('../utils').logging;
const {
  hitCronForAutoCheckoutAppUsers,
  hitCronToSyncPurchaseOrderData,
  hitCronToSyncSalesOrderData
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

  
  if(cluster.isMaster) {
    // cron job for sync Purchase order
    schedule.scheduleJob('0 */2 * * * *', async () => {
      let requestdId = guid();
      let time = moment().format('DD-MM-YYYY HH:mm')
      info('------------------------');
      info('CRON TAB RUNNING STARTED', time);
      cronLogger.info(`CRON-${requestdId} | ${time} | STARTED FOR SYNC PURCHASE ORDER`);
      let isPurchaseOrderUpdated = await hitCronToSyncPurchaseOrderData(requestdId);
      if (isPurchaseOrderUpdated.success) {
        cronLogger.info(`CRON-${requestdId} | ${time} | COMPLETED SUCCESSFULLY - `, JSON.stringify(isPurchaseOrderUpdated.data));
        info('CRON TAB SUCCESSFULLY FINISHED ', time);
      } else {
        cronLogger.error(`CRON-${requestdId} | ${time} | ERROR - `, JSON.stringify(isPurchaseOrderUpdated.error));
        error('CRON TAB ERROR ', time, isPurchaseOrderUpdated.error);
      }
      info('------------------------');
    });

    // cron job for sync Sales order
    schedule.scheduleJob('0 */2 * * * *', async () => {
      let requestdId = guid();
      let time = moment().format('DD-MM-YYYY HH:mm')
      info('------------------------');
      info('CRON TAB RUNNING STARTED', time);
      cronLogger.info(`CRON-${requestdId} | ${time} | STARTED FOR SYNC SALES ORDER`);
      let isSalesOrderUpdated = await hitCronToSyncSalesOrderData(requestdId);
    
      if (isSalesOrderUpdated.success) {
        cronLogger.info(`CRON-${requestdId} | ${time} | COMPLETED SUCCESSFULLY - `, JSON.stringify(isSalesOrderUpdated.data));
        info('CRON TAB SUCCESSFULLY FINISHED ', time);
      } else {
        cronLogger.error(`CRON-${requestdId} | ${time} | ERROR - `, JSON.stringify(isSalesOrderUpdated.error));
        error('CRON TAB ERROR ', time, isSalesOrderUpdated.error);
      }
      info('------------------------');
    });
  }
}