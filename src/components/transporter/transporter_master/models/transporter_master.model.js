const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// schema
const transporterMaster = new Schema({

    code: {
        type: Number
    },
    name: {
        type: String
    },
    noOfRateCategories: {
        type: Number
    },
    emailID: {
        type: String
    },
    contactNo: {
        type: String
    },
    location: {
        type: String
    }
},
    {
        timestamps: true
    });


// exporting the entire module
module.exports = mongoose.model('transporterMaster', transporterMaster);
