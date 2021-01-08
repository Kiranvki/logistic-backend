// Controller
const transporterCtrl = require('../components/transporter/transporter/transporter.controller');

// Responses & others utils 
const mongoose = require('mongoose');
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const _ = require('lodash');
const {
    error,
    info
} = require('../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
    try {
        info('check whether the Transporter exists!');
        // creating a valid mongoose type object 
        let objectId = mongoose.Types.ObjectId;
        let vehicleDetails = {}, // name  
            locationDetails = {}, // transportercontactNo
            contactPersonalDetails = {}; //transporterAltContactNo

        // get the email id   
        // let name = req.body.vehicleDetails.name, // name  
        //     contactNo = req.body.vehicleDetails.contactNo, // transportercontactNo  
        //     altContactNo = req.body.vehicleDetails.altContactNo, //transporterAltContactNo
        //     email = req.body.vehicleDetails.email, // transporterEmail  
        //     altEmail = req.body.vehicleDetails.altEmail, // includedDistance   
        //     streetNo = req.body.locationDetails.streetNo, //streetNo
        //     address = req.body.locationDetails.address,// address
        //     city = req.body.locationDetails.city, //city
        //     country = req.body.locationDetails.country, //country
        //     postalCode = req.body.locationDetails.postalCode, //postalCode
        //     contactPersonName = req.body.contactPersonName, //contactPersonName
        //     contactNumber = req.body.contactPersonalDetails.contactNumber, //contactNumber
        //     altContactNumber = req.body.contactPersonalDetails.altContactNumber, //altContactNumber
        //     emailID = req.body.contactPersonalDetails.emailID, //emailID
        //     altEmailID = req.body.contactPersonalDetails.altEmailID, //altEmailID

        vehicleDetails = {
            ...vehicleDetails,
            ...req.body.vehicleDetails
        }; // name  
        locationDetails = {
            ...locationDetails,
            ...req.body.locationDetails
        }; // transportercontactNo

        contactPersonalDetails = {
            ...contactPersonalDetails,
            ...req.body.contactPersonalDetails
        }; //transporterAltContactNo


        let transporterId = req.params.transporterId,

            isNotChanged = [],
            toChangeObject = []; // 

        if (objectId.isValid(transporterId)) {
            // check whether the transporter details already exist or not 
            let gettransporterDetails = await transporterCtrl.getDetails(transporterId);

            // if transporter details fetched successfully
            if (gettransporterDetails.success) {
                info('VALID Transporter!');

                // check whether the field values are changed or not 
                if (vehicleDetails && vehicleDetails.name && vehicleDetails.name == gettransporterDetails.data.vehicleDetails.name) isNotChanged.push('name');
                else if (vehicleDetails && vehicleDetails.name) toChangeObject = { ...toChangeObject, 'name': vehicleDetails.name }
                if (vehicleDetails && vehicleDetails.contactNo && vehicleDetails.contactNo == gettransporterDetails.data.vehicleDetails.contactNo) isNotChanged.push('contactNo')
                else if (vehicleDetails && vehicleDetails.contactNo) toChangeObject = { ...toChangeObject, 'contactNo': vehicleDetails.contactNo }
                if (vehicleDetails && vehicleDetails.altContactNo && vehicleDetails.altContactNo == gettransporterDetails.data.vehicleDetails.altContactNo) isNotChanged.push('altContactNo')
                else if (vehicleDetails && vehicleDetails.altContactNo) toChangeObject = { ...toChangeObject, 'altContactNo': vehicleDetails.altContactNo }
                if (vehicleDetails && vehicleDetails.email && vehicleDetails.email == gettransporterDetails.data.vehicleDetails.email) isNotChanged.push('email');
                else if (vehicleDetails && vehicleDetails.email) toChangeObject = { ...toChangeObject, 'email': vehicleDetails.email }
                if (vehicleDetails && vehicleDetails.altEmail && vehicleDetails.altEmail == gettransporterDetails.data.vehicleDetails.altEmail) isNotChanged.push('altEmail')
                else if (vehicleDetails && vehicleDetails.altEmail) toChangeObject = { ...toChangeObject, 'altEmail': vehicleDetails.altEmail }
                if (locationDetails && locationDetails.streetNo && locationDetails.streetNo == gettransporterDetails.data.locationDetails.streetNo) isNotChanged.push('streetNo')
                else if (locationDetails && locationDetails.streetNo) toChangeObject = { ...toChangeObject, 'streetNo': locationDetails.streetNo }
                if (locationDetails && locationDetails.address && locationDetails.address == gettransporterDetails.data.locationDetails.address) isNotChanged.push('address')
                else if (locationDetails && locationDetails.address) toChangeObject = { ...toChangeObject, 'address': locationDetails.address }
                if (locationDetails && locationDetails.city && locationDetails.city == gettransporterDetails.data.locationDetails.city) isNotChanged.push('city')
                else if (locationDetails && locationDetails.city) toChangeObject = { ...toChangeObject, 'city': locationDetails.city }
                if (locationDetails && locationDetails.country && locationDetails.country == gettransporterDetails.data.locationDetails.country) isNotChanged.push('country')
                else if (locationDetails && locationDetails.country) toChangeObject = { ...toChangeObject, 'country': locationDetails.country }
                if (locationDetails && locationDetails.postalCode && locationDetails.postalCode == gettransporterDetails.data.locationDetails.postalCode) isNotChanged.push('postalCode')
                else if (locationDetails && locationDetails.postalCode) toChangeObject = { ...toChangeObject, 'postalCode': locationDetails.postalCode }
                if (contactPersonalDetails && contactPersonalDetails.contactPersonName && contactPersonalDetails.contactPersonName == gettransporterDetails.data.contactPersonalDetails.contactPersonName) isNotChanged.push('contactPersonName')
                else if (contactPersonalDetails && contactPersonalDetails.contactPersonName) toChangeObject = { ...toChangeObject, 'contactPersonName': contactPersonalDetails.contactPersonName }
                if (contactPersonalDetails && contactPersonalDetails.contactNumber && contactPersonalDetails.contactNumber == gettransporterDetails.data.contactPersonalDetails.contactNumber) isNotChanged.push('contactNumber')
                else if (contactPersonalDetails && contactPersonalDetails.contactNumber) toChangeObject = { ...toChangeObject, 'contactNumber': contactPersonalDetails.contactNumber }
                if (contactPersonalDetails && contactPersonalDetails.altContactNumber && contactPersonalDetails.altContactNumber == gettransporterDetails.data.contactPersonalDetails.altContactNumber) isNotChanged.push('altContactNumber')
                else if (contactPersonalDetails && contactPersonalDetails.altContactNumber) toChangeObject = { ...toChangeObject, 'altContactNumber': contactPersonalDetails.altContactNumber }
                if (contactPersonalDetails && contactPersonalDetails.emailID && contactPersonalDetails.emailID == gettransporterDetails.data.contactPersonalDetails.emailID) isNotChanged.push('emailID')
                else if (contactPersonalDetails && contactPersonalDetails.emailID) toChangeObject = { ...toChangeObject, 'emailID': contactPersonalDetails.emailID }
                if (contactPersonalDetails && contactPersonalDetails.altEmailID && contactPersonalDetails.altEmailID == gettransporterDetails.data.contactPersonalDetails.altEmailID) isNotChanged.push('altEmailID')
                else if (contactPersonalDetails && contactPersonalDetails.altEmailID) toChangeObject = { ...toChangeObject, 'altEmailID': contactPersonalDetails.altEmailID }


                // including it to request body 
                req.body.toChangeObject = toChangeObject;
                req.body.isNotChanged = isNotChanged;
                req.body.vehicleDetailsFromDb = gettransporterDetails.data.vehicleDetails;
                req.body.locationDetailsFromDb = gettransporterDetails.data.locationDetails;
                req.body.contactPersonalDetailsFromDb = gettransporterDetails.data.contactPersonalDetails;

                // if there is nothing to change
                if (isNotChanged.length)
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.transporterMaster.dataIsNotChanged, req.body.isNotChanged)
                else next(); // move on

                // invalid Transporter
            } else {
                error('INVALID Transporter!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.transporterMaster.transporterId);
            }

            // Transporter id is invalid 
        } else {
            error('The Transporter ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
