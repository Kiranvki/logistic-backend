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
        let transporterName = req.body.vehicleDetails.name || '', // transporterName  
        transportercontactNo = req.body.vehicleDetails.contactNo || '', // transportercontactNo  
        transporterAltContactNo = req.body.vehicleDetails.altContactNo || '', //transporterAltContactNo
        transporterEmail = req.body.vehicleDetails.email, // transporterEmail  
        transporterAltEmail = req.body.vehicleDetails.altEmail, // includedDistance   
        transporterStreetNo = req.body.locationDetails.streetNo, //streetNo
        transporterAddress = req.body.locationDetails.address,// address
        transporterCity = req.body.locationDetails.city, //city
        transporterCountry = req.body.locationDetails.country, //country
        transporterPostalCode = req.body.locationDetails.postalCode, //postalCode
        transporterContactPersonName = req.body.contactPersonName, //contactPersonName
        transporterContactNumber = req.body.contactPersonalDetails.contactNumber, //contactNumber
        transporterAltContactNumber = req.body.contactPersonalDetails.altContactNumber, //altContactNumber
        transporterEmailID = req.body.contactPersonalDetails.emailID, //emailID
        transporterAltEmailID = req.body.contactPersonalDetails.altEmailID, //altEmailID


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
                if (transporterName && transporterName == gettransporterDetails.data.transporterName) isNotChanged.push('transporterName');
                else if (transporterName) toChangeObject = { ...toChangeObject, 'transporterName': transporterName }
                if (transportercontactNo && transportercontactNo == gettransporterDetails.data.transportercontactNo) isNotChanged.push('transportercontactNo')
                else if (transportercontactNo) toChangeObject = { ...toChangeObject, 'transportercontactNo': transportercontactNo }
                if (transporterAltContactNo && transporterAltContactNo == gettransporterDetails.data.transporterAltContactNo) isNotChanged.push('transporterAltContactNo')
                else if (transporterAltContactNo) toChangeObject = { ...toChangeObject, 'transporterAltContactNo': transporterAltContactNo }
                if (transporterEmail && transporterEmail == gettransporterDetails.data.transporterEmail) isNotChanged.push('transporterEmail');
                else if (transporterEmail) toChangeObject = { ...toChangeObject, 'transporterEmail': transporterEmail }
                if (transporterAltEmail && transporterAltEmail == gettransporterDetails.data.transporterAltEmail) isNotChanged.push('transporterAltEmail')
                else if (transporterAltEmail) toChangeObject = { ...toChangeObject, 'transporterAltEmail': transporterAltEmail }
                if (transporterStreetNo && transporterStreetNo == gettransporterDetails.data.transporterStreetNo) isNotChanged.push('transporterStreetNo')
                else if (transporterStreetNo) toChangeObject = { ...toChangeObject, 'transporterStreetNo': transporterStreetNo }
                if (transporterAddress && transporterAddress == gettransporterDetails.data.transporterAddress) isNotChanged.push('transporterAddress')
                else if (transporterAddress) toChangeObject = { ...toChangeObject, 'transporterAddress': transporterAddress }
                if (transporterCity && transporterCity == gettransporterDetails.data.transporterCity) isNotChanged.push('transporterCity')
                else if (transporterCity) toChangeObject = { ...toChangeObject, 'transporterCity': transporterCity }
                if (transporterCountry && transporterCountry == gettransporterDetails.data.transporterCountry) isNotChanged.push('transporterCountry')
                else if (transporterCountry) toChangeObject = { ...toChangeObject, 'transporterCountry': transporterCountry }
                if (transporterPostalCode && transporterPostalCode == gettransporterDetails.data.transporterPostalCode) isNotChanged.push('transporterPostalCode')
                else if (transporterPostalCode) toChangeObject = { ...toChangeObject, 'transporterPostalCode': transporterPostalCode }
                if (transporterContactPersonName && transporterContactPersonName == gettransporterDetails.data.transporterContactPersonName) isNotChanged.push('transporterContactPersonName')
                else if (transporterContactPersonName) toChangeObject = { ...toChangeObject, 'transporterContactPersonName': transporterContactPersonName }
                if (transporterContactNumber && transporterContactNumber == gettransporterDetails.data.transporterContactNumber) isNotChanged.push('transporterContactNumber')
                else if (transporterContactNumber) toChangeObject = { ...toChangeObject, 'transporterContactNumber': transporterContactNumber }
                if (transporterAltContactNumber && transporterAltContactNumber == gettransporterDetails.data.transporterAltContactNumber) isNotChanged.push('transporterAltContactNumber')
                else if (transporterAltContactNumber) toChangeObject = { ...toChangeObject, 'transporterAltContactNumber': transporterAltContactNumber }
                if (transporterEmailID && transporterEmailID == gettransporterDetails.data.transporterEmailID) isNotChanged.push('transporterEmailID')
                else if (transporterEmailID) toChangeObject = { ...toChangeObject, 'transporterEmailID': transporterEmailID }
                if (transporterAltEmailID && transporterAltEmailID == gettransporterDetails.data.transporterAltEmailID) isNotChanged.push('transporterAltEmailID')
                else if (transporterAltEmailID) toChangeObject = { ...toChangeObject, 'transporterAltEmailID': transporterAltEmailID }

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
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT,MessageTypes.transporterMaster.dataIsNotChanged)
                else next(); // move on

                // invalid Transporter
            } else {
                error('INVALID Transporter!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT,MessageTypes.transporterMaster.transporterId);
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
