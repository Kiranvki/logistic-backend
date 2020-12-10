// Controller
const pickerBoySalesOrderItemMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

// Responses & others utils 
const mongoose = require('mongoose');
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const _ = require('lodash');
const {
    error,
    info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
    try {
        info('check whether the pickerBoy SO Item Mapping exists!');
        // creating a valid mongoose type object 
        let objectId = mongoose.Types.ObjectId;

        // get the data
        let itemId = req.body.itemId, // itemId  
            itemName = req.body.itemName, // itemName  
            salePrice = req.body.salePrice, //salePrice
            quantity = req.body.quantity, // quantity  
            suppliedQty = req.body.suppliedQty, // suppliedQty  
            itemAmount = req.body.itemAmount, //itemAmount
            taxPercentage = req.body.taxPercentage, //taxPercentage
            discountPercentage = req.body.discountPercentage, //discountPercentage 
            freeQty = req.body.freeQty, // freeQty

            pickerBoySalesOrderMappingId = req.params.pickerBoySalesOrderMappingId,

            isNotChanged = [],
            toChangeObject = []; // 

        if (objectId.isValid(pickerBoySalesOrderMappingId)) {

            // check whether the document type already exist or not 
            let getItemDetails = await pickerBoySalesOrderItemMappingCtrl.getAddedItemDetails(pickerBoySalesOrderMappingId, itemId);

            // if asm details fetched successfully
            if (getItemDetails.success) {
                info('VALID Item Details!');

                // check whether the field values are changed or not 
                if (itemName && itemName == getItemDetails.data.itemName) isNotChanged.push('itemName');
                else if (itemName) toChangeObject = { ...toChangeObject, 'itemName': itemName }
                if (salePrice && salePrice == getItemDetails.data.salePrice) isNotChanged.push('salePrice')
                else if (salePrice) toChangeObject = { ...toChangeObject, 'salePrice': salePrice }
                if (quantity && quantity == getItemDetails.data.quantity) isNotChanged.push('quantity')
                else if (quantity) toChangeObject = { ...toChangeObject, 'quantity': quantity }
                if (suppliedQty && suppliedQty == getItemDetails.data.suppliedQty) isNotChanged.push('suppliedQty');
                else if (suppliedQty) toChangeObject = { ...toChangeObject, 'suppliedQty': suppliedQty }
                if (itemAmount && itemAmount == getItemDetails.data.itemAmount) isNotChanged.push('itemAmount')
                else if (itemAmount) toChangeObject = { ...toChangeObject, 'itemAmount': itemAmount }
                if (taxPercentage && taxPercentage == getItemDetails.data.taxPercentage) isNotChanged.push('taxPercentage')
                else if (taxPercentage) toChangeObject = { ...toChangeObject, 'taxPercentage': taxPercentage }
                if (discountPercentage && discountPercentage == getItemDetails.data.discountPercentage) isNotChanged.push('discountPercentage')
                else if (discountPercentage) toChangeObject = { ...toChangeObject, 'discountPercentage': discountPercentage }
                if (freeQty && freeQty == getItemDetails.data.freeQty) isNotChanged.push('freeQty')
                else if (freeQty) toChangeObject = { ...toChangeObject, 'freeQty': freeQty }


                // including it to request body 
                req.body.toChangeObject = toChangeObject;
                req.body.isNotChanged = isNotChanged;

                // if there is nothing to change
                if (isNotChanged.length)
                    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.itemDataIsNotChanged, req.body.isNotChanged);
                else next(); // move on

                // invalid Brand
            } else {
                error('INVALID Item Details!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.brand.brandIdInvalidEitherDeletedOrDeactivated);
            }

            // pickerSO mapping id is invalid 
        } else {
            error('The PickerBoy SalesOrder Mapping ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.invalidAsmId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
