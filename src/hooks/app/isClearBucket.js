// Controller
const pickerboySalesOrderItemMappingModel = require('../../components/picker_app/pickerboy_salesorder_items_mapping/models/pickerboy_salesorder_items_mapping.model');
const pickerBoySalesOrderModel = require('../../components/picker_app/pickerboy_salesorder_mapping/models/pickerboy_salesorder_mapping.model');

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
        info('Check whether the details exist for the saleOrderId or not');
        let objectId = mongoose.Types.ObjectId; // object id
        let pickerboyOrderMappingId = req.body.pickerBoySalesOrderMappingId || req.params.pickerBoySalesOrderMappingId, // get the sale order id 
        itemNumber = req.body.item_no,
        totalItemToremove = itemNumber.length;
        // mongoose valid id 
        if (objectId.isValid(pickerboyOrderMappingId)) {

            // check whether the sale Order id is unique or not
            let totalItemInBucketAfterRemoving = await pickerboySalesOrderItemMappingModel.aggregate([{$match:{pickerBoySalesOrderMappingId:mongoose.Types.ObjectId(pickerboyOrderMappingId)}},

            { "$addFields": {
            "size": {
               
                 "$size": { "$filter": {
                  "input": "$itemDetail",
                  "as": "item",
                  "cond": {$not:{$in:["$$item.item_no",itemNumber]}}
                }}
              }}
           },{
               $project:{
                   "size":1
               }
           }])
            // .salesOrderDetailByIdAndPickingDate(saleOrderId)
           

            totalItemInBucketAfterRemoving = totalItemInBucketAfterRemoving[0]['size']
            console.log(totalItemInBucketAfterRemoving)
            // if email is unique
            if (totalItemInBucketAfterRemoving>0) {
                info('Remove item!!')
                

                next();
            } else {
                error('Remove Bucket!');
                let isBucketClear = await pickerBoySalesOrderModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(pickerboyOrderMappingId) },
                { $set: { 'isDeleted': 1, 'status': 0,'isItemPicked':false,'isStartedPicking':false} })
                return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, "Bucket is Cleared!");
            }
        } else {
            error('The PickerBoy Order mapping ID is Invalid !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, "Invalid Picker Boy Mapping ID!");
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
