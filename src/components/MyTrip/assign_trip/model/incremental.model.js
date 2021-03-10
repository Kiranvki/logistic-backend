const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let primarySchema = Schema({
    
    modelName: {
        type: String,
        required: true,
        enum: ['assetTransfer', 'spotsales', 'trip', 'tripSalesOrder']
    },

    currentCount: {
        type: Number,
        required: true
    }
},{
    timestamps: true
});


primarySchema.index({ modelName: 1, currentCount: 1}, { unique: true });

let incementalModel = mongoose.model('primaryIncrementalIndex', primarySchema,'primaryIncrementalIndex');
module.exports = incementalModel;