// Controller
const tripCtrl = require('../../components/MyTrip/assign_trip/mytrip.controller');


// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const mongoose = require('mongoose');
const {
    error,
    info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
    try {
        info('Check whether the invoice generated and details exist for the pickerBoySalesOrderMappingId or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let deliveryExecutiveId = req.user._id || req.user._id; // get the sale order id 

        // mongoose valid id 
        if (objectId.isValid(deliveryExecutiveId)) {

            // check whether the sale Order id is unique or not
            let isActiveTrip = await tripCtrl.activeTripDetail(deliveryExecutiveId)
                



            // 
            if (isActiveTrip.success) {
                info('Active trip Mapping Id!');

                return Response.errors(req, res, StatusCodes.HTTP_FOUND, JSON.stringify({data:isActiveTrip['data'], message:"Active Trip Detail"}));




            } else {
                //invoice not created,  creating new one
                next();

            }
        } else {
            error('The Delivery Executive Id is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.invalidPickerBoySalesOrderMappingId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};