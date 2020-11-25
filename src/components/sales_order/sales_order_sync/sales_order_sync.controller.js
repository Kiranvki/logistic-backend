const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/sales_order_sync.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

// getting the model 
class areaSalesManagerController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.customers;
  }

  // get data based on city 
  getTheStatusBasedOnCity = async (city) => {
    try {
      info(`marking a new customer sync for city ${city} !`);

      // get max waiting time for customer name sync with gofrugal 
      let maxWaitingTime = await BasicCtrl.GET_MAX_CUSTOMER_LIST_SYNC_WAITING_TIME_IN_MINS().then((res) => { if (res.success) return res.data; else return 20; });
      // get max waiting time for customer name sync with gofrugal 
      let maxWaitingTimeForAccounts = await BasicCtrl.GET_MAX_CUSTOMER_ACCOUNTS_SYNC_WAITING_TIME_IN_MINS().then((res) => { if (res.success) return res.data; else return 20; });

      // marking customer list sync 
      let syncData = await Model.aggregate([{
        '$match': { 'cityId': city }
      }, {
        '$project': {
          'cityId': 1,
          'isSyncing': 1,
          'isCustomerAccountSyncing': 1,
          'lastCustomerListSync': { $arrayElemAt: ['$lastCustomerListSync', -1] },
          'lastCustomerAccountsSync': { $arrayElemAt: ['$lastCustomerAccountsSync', -1] },
          'errorInLastCustomerSync': { $arrayElemAt: ['$errorInLastCustomerSync', -1] },
          'errorInLastCustomerAccountSync': { $arrayElemAt: ['$errorInLastCustomerAccountSync', -1] },
          'customerListSyncStarted': 1,
          'customerAccountsSyncStarted': 1
        }
      }, {
        '$limit': 1
      }, {
        '$sort': {
          'createdAt': -1
        }
      }]).allowDiskUse(true);

      // if sync data found
      if (syncData.length) {

        // getting and initialising with the last data 
        syncData = syncData[syncData.length - 1];

        // sync start 
        let syncStartDate = moment(syncData.customerListSyncStarted);
        let todaysDate = moment();

        // get the diff
        let timeDiff = todaysDate.diff(syncStartDate) / 60000;

        info('Time Diff from last sync start ', timeDiff);

        // if the difference 
        if (timeDiff > maxWaitingTime && syncData.isSyncing == true) {
          info('SYNCING TIME PASSED BEYOND THE THRESHOLD !');

          // updating the model 
          let dataToSend = await Model.findOneAndUpdate({
            'cityId': city
          }, {
            '$set': {
              'isSyncing': false
            },
            '$push': {
              'errorInLastCustomerSync': `Max Time Taken has passed the configured value of ${maxWaitingTime} Mins !`
            }
          }, {
            upsert: false,
            new: true
          })

          syncData = dataToSend;
        }

        // CHECKING FOR TALLY ACCOUNTS SYNC 
        syncStartDate = moment(syncData.customerAccountsSyncStarted);

        // get the diff
        timeDiff = todaysDate.diff(syncStartDate) / 60000;

        info('Time Diff from last sync start ', timeDiff);

        // if the difference 
        if (timeDiff > maxWaitingTimeForAccounts && syncData.isCustomerAccountSyncing == true) {
          info('SYNCING TIME PASSED BEYOND THE THRESHOLD !');

          // updating the model 
          let dataToSend = await Model.findOneAndUpdate({
            'cityId': city
          }, {
            '$set': {
              'isCustomerAccountSyncing': false
            },
            '$push': {
              'errorInLastCustomerAccountSync': `Tally Server Not Responding ! Max Time Taken has passed the configured value of ${maxWaitingTimeForAccounts} Mins, Please try again after sometime !`
            }
          }, {
            upsert: false,
            new: true
          });

          syncData = dataToSend;
        }

      } else syncData = {}


      // returning back to the controller 
      return {
        success: true,
        data: syncData
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // check sync already running 
  isCustomerListSyncing = async (city) => {
    try {
      info(`marking a new customer sync for city ${city} !`);

      // get max waiting time for customer name sync with gofrugal 
      let maxWaitingTime = await BasicCtrl.GET_MAX_CUSTOMER_LIST_SYNC_WAITING_TIME_IN_MINS().then((res) => { if (res.success) return res.data; else return 20; });

      // marking customer list sync 
      let syncData = await Model.aggregate([{
        '$match': { 'cityId': city }
      }, {
        '$project': {
          'cityId': 1,
          'isSyncing': 1,
          'customerListSyncStarted': 1
        }
      }, {
        '$limit': 1
      }, {
        '$sort': {
          'createdAt': -1
        }
      }]).allowDiskUse(true);

      // if sync data found
      if (syncData.length) {

        // getting and initialising with the last data 
        syncData = syncData[syncData.length - 1];

        // sync start 
        let syncStartDate = moment(syncData.customerListSyncStarted);
        let todaysDate = moment();

        // get the diff
        let timeDiff = todaysDate.diff(syncStartDate) / 60000;

        info('Time Diff from last sync start ', timeDiff);

        // if the difference 
        if (timeDiff > maxWaitingTime && syncData.isSyncing == true) {
          info('SYNCING TIME PASSED BEYOND THE THRESHOLD !');

          // updating the model 
          let dataToSend = await Model.findOneAndUpdate({
            'cityId': city
          }, {
            '$set': {
              'isSyncing': false
            },
            '$push': {
              'errorInLastCustomerSync': `Max Time Taken has passed the configured value of ${maxWaitingTime} Mins !`
            }
          }, {
            upsert: false,
            new: true
          });

          syncData = dataToSend;
        }

      } else syncData = {}


      // returning back to the controller 
      return {
        success: syncData.isSyncing
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // sync with  tally 
  markANewCustomerListSync = async (city) => {
    try {
      info(`marking a new customer sync for city ${city} !`);

      // marking customer list sync 
      await Model.findOneAndUpdate({
        'cityId': city
      }, {
        '$set': {
          'isSyncing': true,
          'customerListSyncStarted': new Date()
        }
      }, {
        'upsert': true
      })

      // returning back to the controller 
      return {
        success: true
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // mark customer list sync complete
  markCustomerSyncSuccess = async (city) => {
    try {
      info(`marking customer list sync for city ${city} completed !`);

      // marking customer list sync 
      await Model.findOneAndUpdate({
        'cityId': city
      }, {
        '$set': {
          'isSyncing': false
        },
        '$push': {
          'lastCustomerListSync': new Date()
        }
      }, {
        'upsert': true
      })

      // returning back to the controller 
      return {
        success: true
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // check whether the customer accounts is already syncing 
  isCustomerAccountsSyncing = async (city) => {
    try {
      info(`marking a new customer sync for city ${city} !`);

      // get max waiting time for customer name sync with gofrugal 
      let maxWaitingTime = await BasicCtrl.GET_MAX_CUSTOMER_ACCOUNTS_SYNC_WAITING_TIME_IN_MINS().then((res) => { if (res.success) return res.data; else return 20; });

      // marking customer list sync 
      let syncData = await Model.aggregate([{
        '$match': { 'cityId': city }
      }, {
        '$project': {
          'cityId': 1,
          'isSyncing': 1,
          'customerAccountsSyncStarted': 1,
          'isCustomerAccountSyncing': 1
        }
      }, {
        '$limit': 1
      }, {
        '$sort': {
          'createdAt': -1
        }
      }]).allowDiskUse(true);

      // if sync data found
      if (syncData.length) {

        // getting and initialising with the last data 
        syncData = syncData[syncData.length - 1];

        // sync start 
        let syncStartDate = moment(syncData.customerAccountsSyncStarted);
        let todaysDate = moment();

        // get the diff
        let timeDiff = todaysDate.diff(syncStartDate) / 60000;

        info('Time Diff from last sync start ', timeDiff);

        // if the difference 
        if (timeDiff > maxWaitingTime && syncData.isCustomerAccountSyncing == true) {
          info('SYNCING TIME PASSED BEYOND THE THRESHOLD !');

          // updating the model 
          let dataToSend = await Model.findOneAndUpdate({
            'cityId': city
          }, {
            '$set': {
              'isCustomerAccountSyncing': false
            },
            '$push': {
              'errorInLastCustomerAccountSync': `Tally Server Not Responding ! Max Time Taken has passed the configured value of ${maxWaitingTime} Mins, Please try again after sometime !`
            }
          }, {
            upsert: false,
            new: true
          });

          syncData = dataToSend;
        }

      } else syncData = {}


      // returning back to the controller 
      return {
        success: syncData.isCustomerAccountSyncing
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // mark a new customer accounts sync 
  markANewCustomerAccountsSync = async (city) => {
    try {
      info(`marking a new customer accounts sync for city ${city} !`);

      // marking customer list sync 
      await Model.findOneAndUpdate({
        'cityId': city
      }, {
        '$set': {
          'isCustomerAccountSyncing': true,
          'customerAccountsSyncStarted': new Date()
        }
      }, {
        'upsert': true
      })

      // returning back to the controller 
      return {
        success: true
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // mark customer accounts sync success 
  markCustomerAccountsSyncSuccess = async (city) => {
    try {
      info(`marking customer accounts sync for city ${city} completed !`);

      // marking customer list sync 
      await Model.findOneAndUpdate({
        'cityId': city
      }, {
        '$set': {
          'isCustomerAccountSyncing': false
        },
        '$push': {
          'lastCustomerAccountsSync': new Date()
        }
      }, {
        'upsert': true
      })

      // returning back to the controller 
      return {
        success: true
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // mark customer accouts sync failure 
  markCustomerSyncFailure = async (city, error) => {
    try {
      info(`marking customer accounts sync for city ${city} Failed !`);

      // marking customer list sync 
      await Model.findOneAndUpdate({
        'cityId': city
      }, {
        '$set': {
          'isCustomerAccountSyncing': false
        },
        '$push': {
          'errorInLastCustomerAccountSync': error
        }
      }, {
        'upsert': true
      })

      // returning back to the controller 
      return {
        success: true
      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }
}

// exporting the modules 
module.exports = new areaSalesManagerController();
