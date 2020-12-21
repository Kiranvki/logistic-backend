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

        // get the email id   
            name = req.body.name, // name  
            contactNo = req.body.contactNo, // contactNo  
            altContactNo = req.body.altContactNo, //altContactNo
            altContactNumber = req.body.altContactNumber, // brandName  
            email = req.body.email, // email  
            streetNo = req.body.streetNo, //streetNo
            address = req.body.address,// address
            city = req.body.city, //city
            country = req.body.country, //country
            postalCode = req.body.postalCode, //postalCode
            contactPersonName = req.body.contactPersonName, //contactPersonName
            contactNumber = req.body.contactNumber, //contactNumber
            altContactNumber = req.body.altContactNumber, //altContactNumber
            contactNumber = req.body.contactNumber, //contactNumber
            emailID = req.body.emailID, //emailID
            altEmailID = req.body.altEmailID, //altEmailID


            /*
            streetNo = req.body.streetNo, // brandName  
            address = req.body.address, // email  
            city = req.body.city,
            country = req.body.country, // brandName  
            postalCode = req.body.postalCode, // email  
            gstNo = req.body.gstNo,
            targetSetting = req.body.targetSetting, // email  
            targetStartDate = req.body.targetStartDate,
            targetEndDate = req.body.targetEndDate, // brandName  
            itemDetails = req.body.itemDetails, // email  
            latitude = req.body.latitude,
            longitude = req.body.longitude, // brandName  
*/

            transporterId = req.params.transporterId,

            isNotChanged = [],
            toChangeObject = []; // 

        if (objectId.isValid(transporterId)) {
            // check whether the document type already exist or not 
            let gettransporterDetails = await transporterCtrl.getDetails(transporterId);

            // if asm details fetched successfully
            if (gettransporterDetails.success) {
                info('VALID Transporter!');

                // check whether the field values are changed or not 
                if (name && name == gettransporterDetails.data.name) isNotChanged.push('name');
                else if (name) toChangeObject = { ...toChangeObject, 'name': name }
                if (contactNo && contactNo == gettransporterDetails.data.contactNo) isNotChanged.push('contactNo')
                else if (contactNo) toChangeObject = { ...toChangeObject, 'contactNo': contactNo }
                if (altContactNo && altContactNo == gettransporterDetails.data.altContactNo) isNotChanged.push('altContactNo')
                else if (altContactNo) toChangeObject = { ...toChangeObject, 'altContactNo': altContactNo }
                if (email && email == gettransporterDetails.data.email) isNotChanged.push('email');
                else if (email) toChangeObject = { ...toChangeObject, 'email': email }
                if (altEmail && altEmail == gettransporterDetails.data.altEmail) isNotChanged.push('altEmail')
                else if (altEmail) toChangeObject = { ...toChangeObject, 'altEmail': altEmail }
                if (streetNo && streetNo == gettransporterDetails.data.streetNo) isNotChanged.push('streetNo')
                else if (streetNo) toChangeObject = { ...toChangeObject, 'streetNo': streetNo }
                if (address && address == gettransporterDetails.data.address) isNotChanged.push('address')
                else if (address) toChangeObject = { ...toChangeObject, 'address': address }
                if (city && city == gettransporterDetails.data.city) isNotChanged.push('city')
                else if (city) toChangeObject = { ...toChangeObject, 'city': city }
                if (country && country == gettransporterDetails.data.country) isNotChanged.push('country')
                else if (country) toChangeObject = { ...toChangeObject, 'country': country }
                if (postalCode && postalCode == gettransporterDetails.data.postalCode) isNotChanged.push('postalCode')
                else if (postalCode) toChangeObject = { ...toChangeObject, 'postalCode': postalCode }
                if (contactPersonName && contactPersonName == gettransporterDetails.data.contactPersonName) isNotChanged.push('contactPersonName')
                else if (contactPersonName) toChangeObject = { ...toChangeObject, 'contactPersonName': contactPersonName }
                if (contactNumber && contactNumber == gettransporterDetails.data.contactNumber) isNotChanged.push('contactNumber')
                else if (contactNumber) toChangeObject = { ...toChangeObject, 'contactNumber': contactNumber }
                if (altContactNumber && altContactNumber == gettransporterDetails.data.altContactNumber) isNotChanged.push('altContactNumber')
                else if (altContactNumber) toChangeObject = { ...toChangeObject, 'altContactNumber': altContactNumber }
                if (emailID && emailID == gettransporterDetails.data.emailID) isNotChanged.push('emailID')
                else if (emailID) toChangeObject = { ...toChangeObject, 'emailID': emailID }
                if (altEmailID && altEmailID == gettransporterDetails.data.altEmailID) isNotChanged.push('altEmailID')
                else if (altEmailID) toChangeObject = { ...toChangeObject, 'altEmailID': altEmailID }

                /*
                 if (streetNo && streetNo == getBrandDetails.data.streetNo) isNotChanged.push('streetNo');
                 else if (streetNo) toChangeObject = { ...toChangeObject, 'streetNo': streetNo }
                 if (address && address == getBrandDetails.data.address) isNotChanged.push('address')
                 else if (address) toChangeObject = { ...toChangeObject, 'address': address }
                 if (city && city == getBrandDetails.data.city) isNotChanged.push('city')
                 else if (city) toChangeObject = { ...toChangeObject, 'city': city }
                 if (country && country == getBrandDetails.data.country) isNotChanged.push('country');
                 else if (country) toChangeObject = { ...toChangeObject, 'country': country }
                 if (postalCode && postalCode == getBrandDetails.data.postalCode) isNotChanged.push('postalCode')
                 else if (postalCode) toChangeObject = { ...toChangeObject, 'postalCode': postalCode }
                
                 if (targetSetting && targetSetting == getBrandDetails.data.targetSetting) isNotChanged.push('targetSetting')
                 else if (targetSetting) toChangeObject = { ...toChangeObject, 'targetSetting': targetSetting }
                 if (targetStartDate && targetStartDate == getBrandDetails.data.targetStartDate) isNotChanged.push('targetStartDate')
                 else if (targetStartDate) toChangeObject = { ...toChangeObject, 'targetStartDate': targetStartDate }
                 if (targetEndDate && targetEndDate == getBrandDetails.data.targetEndDate) isNotChanged.push('targetEndDate');
                 else if (targetEndDate) toChangeObject = { ...toChangeObject, 'targetEndDate': targetEndDate }
                 if (itemDetails && itemDetails == getBrandDetails.data.itemDetails) isNotChanged.push('itemDetails')
                 else if (itemDetails) toChangeObject = { ...toChangeObject, 'itemDetails': itemDetails }
                 if (latitude && latitude == getBrandDetails.data.latitude) isNotChanged.push('latitude')
                 else if (latitude) toChangeObject = { ...toChangeObject, 'latitude': latitude }
                 if (longitude && longitude == getBrandDetails.data.longitude) isNotChanged.push('longitude')
                 else if (longitude) toChangeObject = { ...toChangeObject, 'longitude': longitude }
                */
                // including it to request body 
                req.body.toChangeObject = toChangeObject;
                req.body.isNotChanged = isNotChanged;

                // if there is nothing to change
                if (isNotChanged.length)
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT)
                else next(); // move on

                // invalid Transporter
            } else {
                error('INVALID Transporter!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT);
            }

            // asm id is invalid 
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
