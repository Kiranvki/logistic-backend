const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//schema
const transporter = new Schema({

    vehicleDetails: {
        name: {
            type: String
        },
        contactNo: {
            type: Number
        },
        altContactNo: {
            type: Number
        },
        email: {
            type: String
        },
        altEmail: {
            type: String
        }
    },

    locationDetails: {
        streetNo: {
            type: String
        },
        address: {
            type: String
        },
        city: {
            type: String
        },
        country: {
            type: String
        },
        postalCode: {
            type: Number
        }
    },
    contactPersonalDetails: {
        contactPersonName: {
            type: String
        },
        contactNumber: {
            type: Number
        },
        altContactNumber: {
            type: Number
        },
        emailID: {
            type: String
        },
        altEmailID: {
            type: String
        }
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
transporter.index({
    'name': 1,

});


// exporting the entire module
module.exports = mongoose.model('transporters', transporter, 'transporters');