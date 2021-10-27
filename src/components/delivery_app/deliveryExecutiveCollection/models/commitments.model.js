const mongoose = require('mongoose');

let commitmentsSchema = mongoose.Schema({
    // callId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'callLogs'
    // },
    'deliveryExecutiveId': {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'deliveryExecutives',
        autopopulate: {
          select: ['employerName', 'fullName', 'employeeId']
        }
      },
    totalCommitmentAmount: {
        type: Number
    },
    commitmentDate: {
        type: Date
    },
    'commitmentDateTime': {
        type: Number
      },
    paymentMode: {
        cash: {
            type: Boolean
        },
        cheque: {
            type: Boolean
        },
        online: {
            type: Boolean
        },
        demandDraft: {
            type: Boolean
        }
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId
    },
    customerCode: {
        type: String
    },
    customerName: {
        type: String
    },
    customerGroup: {
        type: String
    },
    customerSubgroup: {
        type: String
    },
    location: {
        type: String
    },
    employeeCode: {
        type: String
    },
    'goFrugalId': {
        type: 'Number'
      },
    employeeId: {//needs to beChanged
        type: mongoose.Schema.Types.ObjectId 
    },
    commitmentComment: {
        type: String
    },
    commitmentStatus: {
        type: Boolean,
        default: false
    },
    logType: {
        type: String,
        enum: ['Calls', 'Visits']
    },
    logPurpose: {
        type: String,
        enum: ['Collections', 'BalanceConfirmation', 'Pricing']
    }
}, {
    timestamps: true
});

let commitmentModel = mongoose.model('Commitments', commitmentsSchema, 'appsalesmancommitments');
module.exports = commitmentModel;