module.exports = {
  hitCronToGeneratePublishedBeatPlans: require('./hitCronToGeneratePublishedBeatPlans'), // hit cron to generate published beat plan from draft beat plan 
  hitCronToSyncCustomerOthersDetails: require('./hitCronToSyncCustomerOthersDetails'), // hit cron to sync tally customer data 
  hitTallyCustomerAccountsSync: require('./hitTallyCustomerAccountsSync'), // hit tally customer accounts sync
};