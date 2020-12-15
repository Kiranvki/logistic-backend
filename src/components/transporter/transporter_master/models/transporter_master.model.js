const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// schema
const transporterMaster = new Schema({
    regNumber: {
        type: String
    },
    vehicleType: {
        type: String
    },
    vehicleModel: {
        type: String
    },
    height:{
        type: Number
    },
    length:{
        type: Number
    },
    breadth: {
        type: Number
    },
    status: {
        type: Number,
        default: 1
    },
    isDeleted: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});


// exporting the entire module
module.exports = mongoose.model('transporterMaster', transporterMaster);
