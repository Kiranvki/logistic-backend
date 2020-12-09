const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema
const rateCategory = new Schema({
    rateCategory : {
        type: String
    },
    type: {
        type: String
    },
    vehicle:{
        type: String
    },
    vehicle_type:{
        type: String
    },
    tonnage:{
        type: String
    },
    expireOn:{
        type:Date
    },
},
{
    timestamps: true
  })

// exporting the entire module
module.exports = mongoose.model('rateCategory', rateCategory);