// controller function

const pickerBoySalesOrderItemMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller'); // pickerboy SO Item mapping ctrl
const pickerBoySalesOrderMappingCtrl = require('../../components/picker_app/pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller'); // pickerboy SO mapping ctrl

// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');

// logging 
const {
    error,
    info
} = require('../../utils').logging;

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * LOGIC: 
 * 1. If the user forgets to checkout then the last sales order picking would be his checkout time.
 * 2. If the user forgets to checkout and dont have any sales order picking time then his checkIn time would be his checkout time.
 */
// exporting the hooks 
function isValidQuantity(pickedItem, availableStock) {
    info('Check available Quantity!')
    let materialStock = availableStock.filter(item => {
        return (item['material_no'] == pickedItem['material_no'] && item['plant'] == pickedItem['plant'] && item['storage_location'] == pickedItem['storage_location'])
    })
   


    if (materialStock.length && !_.isEmpty(materialStock)) {
        if (parseFloat(materialStock[0]['unrestricted']) - pickedItem['pickedQuantity'] >= 0) {
            return {
                'status': true,
                'messsage': 'Stock Available To proceed',
                'availableStock': parseFloat(materialStock[0]['unrestricted']),
                'requestedQuantity': parseFloat(pickedItem['pickedQuantity']),
                'material_no': pickedItem['material_no'],
                'itemName': pickedItem['itemName'],

            }
        } else {
            return {
                'status': false,
                'messsage': 'Stock Not Available To proceed.',
                'availableStock': parseFloat(materialStock[0]['unrestricted']),
                'requestedQuantity': parseFloat(pickedItem['pickedQuantity']),
                'quantityExceed': (parseFloat(materialStock[0]['unrestricted']) - parseFloat(pickedItem['pickedQuantity'])),
                'material_no': pickedItem['material_no'],
                'itemName': pickedItem['itemName'],
            }


        }
    } else {
        info('Material Not Available!')

        return {
            'status': false,
            'material_no': pickedItem['material_no'],
            'itemName': pickedItem['itemName'],
            'messsage': 'Material Not Available.'
        }
    }

}

module.exports = async (req, res, next) => {
    try {
        info('Getting the item detail !');
        var isAvailable = []




        let orderDetail = req.body.orderDetail['itemDetail'],
            stockDetail = req.body.materialStockDetail;





        orderDetail.forEach(item => {

            isAvailable.push(isValidQuantity(item, stockDetail['data']));


        })
       
        console.log('isAvailable',isAvailable)

         _.remove(isAvailable, { 'status': true })





        if ( _.isEmpty(isAvailable)) {

            // move on 

            return next()

        } else {
            error('Material Not in Stock.')
            return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, "Stock Not Available.", isAvailable);
        }



        // catch any runtime error 
    } catch (e) {
        error(e);
        return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
