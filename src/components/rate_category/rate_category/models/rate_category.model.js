const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//schema
const rateCategoryModel = new Schema({
    'rateCategoryDetails':
    {
        'rateCategoryName': {
            type: 'String'
        },
        'rateCategoryType': {
            type: 'String',
            enum: ['Daily', 'Monthly', 'weekly']
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
        'additionalAmount': {
            type: 'Number'
        }
    },

    // 'noOfVehicles': {
    //     type: 'Number',
    // },

    'status': {
        type: Number,
        default: 1
    },
    'isDeleted': {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    });


// creating indexes
rateCategoryModel.index({
    'rateCategoryDetails.rateCategoryName': 1
})

// exporting the entire module
module.exports = mongoose.model('rateCategoryModel', rateCategoryModel);