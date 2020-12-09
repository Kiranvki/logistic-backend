const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//schema
const newTransporter = new Schema({
    'transporterName':{
        type: 'String' 
    },
    'vechContactNumber':{
        type: Number
    },
    'alternateContactNumber':{
        type : Number
    },
    'email':{
        type: String
    },
    'alternateEmail':{
        type: String
    },
    'streetNo':{
        type: String
    },
    'address':{
        type: String
    },
    'city':{
        type: String
    },
    'country': {
        type: String
    },
    'postalCode':{
        type : Number
    },
    'contactPersonName':{
        type: String
    },
    'contactNumber':{
        type: Number
    },
    'alternativeContactNumber':{
        type: Number
    },
    'emailID':{
        type: String
    },
    'alternativeEmailID':{
        type: String
    }
},
  {
    timestamps: true
  });  


// exporting the entire module
module.exports = mongoose.model('newTransporter', newTransporter);