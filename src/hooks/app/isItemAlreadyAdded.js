// Controller
const pickerSalesOrderItemMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

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
        info('Check whether the item alread added for the saleOrderId or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let pickerBoySalesOrderMappingId = req.body.pickerBoySalesOrderMappingId || req.params.pickerBoySalesOrderMappingId; // get the pickerBoySalesOrderMappingId
        let item_no = req.body.item_no, //get the itemId
        isEdit = req.query.isEdit||req.query.isedit||0;
        // mongoose valid id 
        if (objectId.isValid(pickerBoySalesOrderMappingId)) {

            // check whether the sale Order id is unique or not
            let isValidItemAdded = await pickerSalesOrderItemMappingCtrl.getAddedItemDetails(pickerBoySalesOrderMappingId, item_no)

            // if Item added or not
            if (!isValidItemAdded.success) {
                info('Item not added')
                next();
            } else {
                if(isEdit){
                    next()
                }else{
                error('Item already added!');
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.itemAlreadyAdded);
            }
        }
        } else {
            error('The SaleOrder ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.invalidSalesOrderId);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
