const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const { pleaseSelectAFileToUpload } = require('../../../../responses/types/fileHandler');
const Schema = mongoose.Schema;

let tripSchema = Schema ({
    vehicleId: [{
        type: Schema.Types.ObjectId,
        ref: 'vehicleMaster'
    }],
    checkedInId: [{
        type: Schema.Types.ObjectId,
        ref: 'vehicleAttendance'
    }],
    rateCategoryId: [{
        type: Schema.Types.ObjectId,
        ref: 'rateCategoryModel'
    }],
    salesOrderId: [{
        type: Schema.Types.ObjectId,
        ref: 'salesOrder'
    }],
    deliveryExecutiveId: [{
        type: Schema.Types.ObjectId,
        ref: 'deliveryExecutive'
    }],
    invoice_db_id: [{
        type: Schema.Types.ObjectId,
        ref: 'invoiceMaster'
    }],
    invoiceNo: [{
        type: String
    }],
    createdByName: {
        type: String
    },
    createdById: {
        type: Schema.Types.ObjectId
    },
    deliveryDetails: {
        invoicesNo: [String],
        stockTransfer: [String],
        netWeight: Number
    },
    transporterDetails: {
        transporter: {
            type: String
        },
        invoiceNo: {
            type: String
        },
        invoice_db_id: {
            type: Schema.Types.ObjectId,
            ref: 'invoicemasters'
        },
        vehicle: {
            type: String
        },
        vehicleId: {
            type: Schema.Types.ObjectId,
            ref: 'vehiclemasters'
        },
        deliveryExecutiveName: {
            type: String
        },
        deliveryExecutiveId: {
            type: String
        },
        tonnage: {
            type: Number
        },
        measureUnit: {
            type: String,
            default: 'kg',
            enum: ['kg', 'tons']
        }
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
    startOdometerReading:{
        type:Number,
        default:0

    },
    endOdometerReading:{
        type:Number,
        default:0
        
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
    spotSalesId: {
        type: Schema.Types.ObjectId,
        ref: 'spotSales'
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

