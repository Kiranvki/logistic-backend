const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let spotSalesSchema = Schema({
    tripId: {
        type: Schema.Types.ObjectId,
        ref: 'trips'
    },
    vehicleId: {
        type: Schema.Types.ObjectId,
        ref: 'vehicleMaster'
    },
    salesManName: {
        type: String
    },
    salesManId: {
        type: Schema.Types.ObjectId,
    },
    salesManCode: {
        type: String
    },
    items: [{
        itemName: {
            type: String
        }, 
        itemId: {
            type: Number
        },
        cityId: {
            type: String
        },
        item_id: {
            type: Schema.Types.ObjectId
        },
        quantity: {
            type: Number
        }, 
        measureUnit: {
            type: String
        } 
      }],
      cityId: {
          type: String
      },
      spotId: {
        type: Number,
        unique: true,
        required: true
      }    
},{
    timestamps: true
});

spotSalesSchema.index({ 'cityId': 1, 'tripId': 1, 'spotId': 1 });

let spotSalesModel = mongoose.model('spotSales', spotSalesSchema, 'spotSales');

module.exports = spotSalesModel;

