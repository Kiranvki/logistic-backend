const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const { pleaseSelectAFileToUpload } = require('../../../../responses/types/fileHandler');
const Schema = mongoose.Schema;

let tripSchema = Schema ({
    vehicleId: [{
        type: Schema.Types.ObjectId
    }],
    checkedInId: [{
        type: Schema.Types.ObjectId
    }],
    salesOrderId: [{
        type: Schema.Types.ObjectId
    }],
    deliveryDetails: {
        invoicesNo: [String],
        stockTransfer: [String],
        netWeight: Number
    },
    approvedBySecurityGuard: {
        type: Number,
        default: 0
    },
    securityGuardId: {
        type: Schema.Types.ObjectId
    },
    isTripStarted: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Number,
        default: 0
    },
    tripFinished: {
        type: Number,
        default: 0
    },
    isCompleteDeleiveryDone: {
        type: Number,
        default: 0
    },
    isPartialDeliveryDone: {
        type: Number,
        default: 0
    },
    returnedStockDetails: [{

    }],
    tripId: {
        type: Number,
        unique: true,
        required: true
    },
    cityId: {
        type: String,
        enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
    }
},{
    timestamps: true
});

tripSchema.plugin(autopopulate);

// creating indexes
tripSchema.index({ 'cityId': 1 });

let tripModel = mongoose.model('trips', tripSchema, 'trips');
module.exports = tripModel;

