const mongoose = require('mongoose');

let deCollectionInvoiceMappingSchema = mongoose.Schema({
    sold_to_party: {
        type: String
    },
    invoice_date: {
        type: Date
    },
    totalAmount: {
        type: Number
    },
    invoiceId: {
        type: String
    },
    invoiceNo: {
        type: String
    },
    location: {
        type: String
    },
    isApprovedByFC: {
        type: Boolean,
        default: false    
    },
    partialMapping: {
        type: Boolean,
        default: false
    },
    isFullfilled: {
        type: Boolean,
        default: false
    },
    amountRemaining: {
        type: Number,
        default: 0        
    },
    invoiceState: {
        type: String,
        enum: ['fulfilled', 'pending', 'partial'],
        default: 'pending'
    },
    isDisputed: {
        type: Boolean,
        default: false
    },
    employeeCode: {
        type: String
    },
    collectionId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'collections'
    }],
    commitmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commitments'
    },
    mappingDate: {
        type: Date,
        default: new Date()
    },
    'collectionsDone': [{
        'id': {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'customersPaymentMapping',
          autopopulate: {
            select: ['paymentAmount', 'entryDate']
          }
        },
        'amount': {
          type: Number
        },
        'dateOfCollection': {
          type: Date
        }
      }],
    amount: Number
}, {
    timestamps: true
});

let deCollectionInvoiceMapping = mongoose.model('deCollectionInvoiceMapping', deCollectionInvoiceMappingSchema);
module.exports = deCollectionInvoiceMapping;