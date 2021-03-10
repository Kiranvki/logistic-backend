const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let assetSchema = Schema({
    deliveryDate: {
        type: Date        
    },
    sourceWarehouseName: {
        type: String
    },
    sourceWarehouseId: {
        type: Schema.Types.ObjectId
    }, 
    destinationWarehouseName: {
        type: String
    },
    destinationWarehouseId: {
        type: Schema.Types.ObjectId
    },
    assetCount: {
        type: Number
    },
    assets:[{
        assetId: {
            type: String
        },
        assetName: {
            type: String
        },
        assetQuantity: {
            type: String
        },
    }],
    tripStarted: {
        type: Boolean,
        default: false
    },
    assetShipped: {
        type: Boolean,
        default: false
    },
    assetDelivered: {
        type: Boolean,
        default: false
    },
    assetDeliveredTime: {
        type: Date
    },
    createdById: {
        type: Schema.Types.ObjectId
    },
    createdByEmpId: {
        type: String
    },
    createdByName: {
        type: String
    },
    cityId: {
        type: String
    },
    tripId: {
        type: Schema.Types.ObjectId
    },
    mappedToVehicle: {
        type: Boolean,
        default: false
    },
    vehicleId: {
        type: Schema.Types.ObjectId
    },
    deliveryExecutiveId: {
        type: Schema.Types.ObjectId
    },
    stage: [{
        name: {
            type: String,
            enum: ['created', 'shipped', 'delivered'],
        },
        empName: {
            type: String
        },
        dateTime: {
            type: Date
        }
    }],
    assetRecId: {
        type: Number,
        unique: true,
        required: true
    },
    assetRecIdAlias: {
        type: String
    }        
},{
    timestamps: true
});

assetSchema.index({ 'cityId': 1, 'tripId': 1, 'assetRecId': 1 });

let assetModel = mongoose.model('assetTransfer', assetSchema, 'assetTransfer');
module.exports = assetModel;

