const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//schema
const rateCategoryModel = new Schema({
    'rateCategoryDetails':
    {
        'rateCategory': {
            type: 'String'
        },
        'rateCategoryType': {
            type: 'String',
            enum: ['Daily', 'Monthly']
        },
        'fixedRentalAmount': {
            type: 'Number'
        },
        'includedAmount': {
            type: 'Number'
        },
        'includedDistance': {
            type: 'Number'
        },
        'addetionalAmount': {
            type: 'Number'
        }
    },
    'vehicleDetails':
    {
        'selectNoOfVehicles': {
            type: 'Number'
        },
        // 'transporterName': {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'newvehicle',
        //     autopopulate: {
        //         select: ['transporterName','vehicleModel']
        //     }
        // }
    },
    status: {
        type: Number,
        default: 1
    },
    isDeleted: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    });


    // creating indexes
    rateCategoryModel.index({
        'vehicleDetails': 1
    })

// exporting the entire module
module.exports = mongoose.model('rateCategoryModel', rateCategoryModel);