const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const customersSync = new Schema({
  'cityId': {
    type: 'String',
    enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
  },
  'isSyncing': {
    type: 'Boolean',
    default: false
  },
  'isCustomerAccountSyncing': {
    type: 'Boolean',
    default: false
  },
  'saledOrderListSyncStarted': {
    type: 'Date'
  },
  'customerAccountsSyncStarted': {
    type: 'Date'
  },
  'lastSalesOrderListSync': [{
    type: 'Date'
  }],
  'lastCustomerAccountsSync': [{
    type: 'Date'
  }],
  'errorInLastCustomerSync': [{
    type: String
  }],
  'errorInLastCustomerAccountSync': [{
    type: String
  }]
}, {
  timestamps: true
});

customersSync.index({
  'cityId': 1,
  'goFrugalId': 1,
  'dbStatus': 1,
  'createdAt': 1
});

// exporting the entire module
module.exports = mongoose.model('customersSync', customersSync);