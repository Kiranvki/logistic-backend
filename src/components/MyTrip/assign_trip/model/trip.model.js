const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

let tripSchema = Schema ({
     
    deliveryDetails: {
        invoiceNo: [String],
        stockTransfer: [String],
        assetTransfer: [String],
        spotSales: [String],
        netWeight: Number
    },

    spotSalesId: [{
        type: Schema.Types.ObjectId,
        ref: 'spotSales'
    }],

    hasSpotSales: {
        type: Boolean,
        default: false
    },

    assetTransfer: [{
        type: Schema.Types.ObjectId,
        ref: 'assetTransfer'
    }],

    hasAssetTransfer: {
        type: Boolean,
        default: false
    },

    salesOrderTripIds: [{
        type: Schema.Types.ObjectId,
        ref: 'tripSalesOrders'
    }],

    hasStockTransfer: {
        type: Boolean,
        default: false
    },

    stockTransferIds: [{
        type: Schema.Types.ObjectId
        // ref: ''
    }],

    salesOrder: {
        type: Schema.Types.ObjectId,
        ref: 'salesOrder'
    },

    transporterName: {
        type: String
    },

    transporterId: {
        type: Schema.Types.ObjectId,
        ref: 'transporters'
    },

    rateCategoryId: {
        type: Schema.Types.ObjectId,
        ref: 'rateCategoryModel'
    },

    vehicleRegNumber: {
        type: String
    },

    vehicleId: {
        type: Schema.Types.ObjectId,
        ref: 'vehicleMaster'
    },

    vehicleModel: {
        type: String
    },

    deliveryExecutiveName: {
        type: String
    },

    deliveryExecutiveId: {
        type: Schema.Types.ObjectId,
        ref: 'deliveryExecutive'
    },

    deliveryExecutiveEmpCode: {
        type: String
    },

    tonnage: {
        type: String
    },

    measureUnit: {
        type: String,
        default: 'kg',
        enum: ['kg', 'tons']
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
    initialOdometerReading: {
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

    createdByName: {
        type: String
    },

    createdById: {
        type: Schema.Types.ObjectId
    },

    returnedStockDetails: [{

    }],

    tripId: {
        type: Number,
        unique: true,
        required: true
    },

    tripIdAlias: {
        type: String
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




