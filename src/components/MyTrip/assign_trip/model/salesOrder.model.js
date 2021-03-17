const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let salesOrderSchema = Schema({

    salesOrderId: {
        type: Schema.Types.ObjectId,
        ref: 'salesOrder'
    },

    soId: {
        type: Number
    },

    invoice_db_id: [{
        type: Schema.Types.ObjectId,
        ref: 'invoiceMaster'
    }],

    invoiceNo: [{
        type: String
    }],

    salesOrderCode: {
        type: Number,
        unique: true,
        required: true
    },
    salesOrderCodeAlias: {
        type: String
    },
    isSelected: {
        type: Boolean,
        default: false
    },
},{
    timestamps: true
});

let tripSalesOrderModel = mongoose.model('tripSalesOrders', salesOrderSchema, 'tripSalesOrders');
module.exports = tripSalesOrderModel;
