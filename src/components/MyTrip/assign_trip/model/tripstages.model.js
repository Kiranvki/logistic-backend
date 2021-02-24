const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let tripStageSchema = Schema ({

userId: {
    type: Schema.Types.ObjectId,
    required: true
},

phase: {
    type: String,
    enum: ['select invoices', 'select vehicle', 'delivery summary', 'optimize preview'],
    default: 'select invoices',
    required: true
},

isActive: {
    type: Boolean,
    default: true
},

isInvoicesSelected: {
    type: Boolean,
    default: false
},
selectInvoices: {},

isVehicleSelected: {
    type: Boolean,
    default: false
}, 
selectVehicle: {},

isDeliverySummary: {
    type: Boolean,
    default: false
},
deliverySummary: {},

isOptimizePreview: {
    type: Boolean,
    default: false
},
optimizePreview: {}

}, {
    timestamps: true
});

module.exports = mongoose.model('tripStages', tripStageSchema, 'tripStages');