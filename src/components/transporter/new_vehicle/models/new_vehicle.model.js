const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// schema
const newvehicle = new Schema({
    transporterName: {
        type: String
    },
    regNumber: {
        type: Number
    },
    vehicleType: {
        type: String
    },
    vehicleModel: {
        type: String
    },
    length: {
        typer: Number
    },
    breadth: {
        type: Number
    },
},
    {
        timestamps: true
    });


// exporting the entire module
module.exports = mongoose.model('newvehicle', newvehicle);
