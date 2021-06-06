// Controller
const request = require('../../utils/request');
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const BasicCtrl = require('../../components/basic_config/basic_config.controller');
const stoPickingDetailModel = require('../../components/picker_app/external_purchase_order/stock_transfer_picking_details/models/stock_transfer_picking_details.model');
const pickerBoyOrderItemMappingModel = require('../../components/picker_app/pickerboy_salesorder_items_mapping/models/pickerboy_salesorder_items_mapping.model')
const moment = require('moment')

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  let stoPickingId = req.params.stoPickingId
  try {
    info(`Hitting the SAP for Picking Allocation !`);
    console.log('test',req.body.pickedStoDetails);
    let items = req.body.pickedStoDetails.item,
    shipping_plant = req.body.pickedStoDetails.shipping_plant,
    stoNumber = req.body.pickedStoDetails.stoNumber,
    
    date = moment(new Date()).format('YYYY-MM-DD');  //new Date()
  
    let sapBaseUrl = process.env.sapBaseUrl;


    // let url = sapBaseUrl + 'waycool_qua/Picking_Allocation_Creation';
    let url = process.env.sapStoOutboundDelivery;

    console.log('Hitting SAP server for Generating the delivery Number *> ', url);
    var obj = {
      'request': {
        'purchse_order_no':stoNumber ,
        'due_date': date,
        'shipping_point': shipping_plant,
        'item': []

      }
    }
  
       
    items.forEach(item => {
      obj['request']['item'].push({
        'item_no': item['item_no'],
        'quantity': (item['pickedQuantity']).toString(),
        'unit_of_measure': item['unit_of_measure'] || 'KG'



      })
    });

    //  var obj = {"request":{"sales_order_no":"0300000413","delivery_date":"2021-04-08","shipping_point":"1004","item":[{"sales_order_item_no":"10","delivery_quantity":"2","uom":"PAK"}]}}

    console.log('OrderData', JSON.stringify(obj))


    // get the data from SAP
    // req.body.delivery_detail = await request.post(url)
    //   .send(obj)
    //   .timeout({
    //     response: 65000, // Wait 10 seconds for the server to start sending,
    //     deadline: 65000, // but allow 1 minute for the file to finish loading.
    //   })
    //   .retry(1)
    //   .then((res, body) => {

    //     // checking whether the user is authentic
    //     if (res.status === 200) {
    //       info('Document Generated Successfully !');
    //       return {
    //         success: true,
    //         data: res.body.response,
    //       };
    //     } else {
    //       error('Error Updating Server !');
    //       return {
    //         success: false,
    //         error: 'Error Updating Server !'
    //       };
    //     }
    //     // catch any runtime error
    //   }, (err) => {
    //     error(err);
    //     if (err.timeout) {
    //       return {
    //         success: false,
    //         error: 'API timeout'
    //       };
    //     } else {
    //       return {
    //         success: false,
    //         error: err
    //       };
    //     }
    //   });

    // 300000442
    //800000515


    req.body.delivery_detail =
    {
              success: true,
              data:  {

    
  
          "outbound_delivery_no": "0800000962",
  
          "flag": "S"
  
      
  
  }
}
    // catch any runtime error 
  } catch (e) {
    error(e);
    return {
      success: false,
      error: e
    };
  }
  // req.body.delivery_detail['success']
  console.log('delivery_data', req.body.delivery_detail)
  // console.log('sap',req.body.delivery_detail['success'],req.body.delivery_detail['data']['flag']==='S')
  if (req.body.delivery_detail['success'] && req.body.delivery_detail['data']['flag'] === 'S') {
    info('Order number generating sucessfully !')
    req.body.obj = obj;
  
    next()

  } else {
    if (req.body.delivery_detail['success'] && req.body.delivery_detail['data']['flag'] === 'E') {
      info('Failed to generate delivery NO.')
      let isResponseUpdated = stoPickingDetailModel.findOneAndUpdate({
        '_id': stoPickingId
      }, {
        $set: {
          'pickingAllocationResponsePayload': JSON.stringify(req.body.delivery_detail),
          'pickingAllocationRequestPayload': JSON.stringify(obj),
          'isItemPicked': false,
          'isStartedPicking': false,
          'state': 1,
          'isDeleted': 1,
          'isSapError': 'DNE' //DNE->delivery_no error
        }
      })
      // //fixed require
      // await pickerBoyOrderItemMappingModel.update({ 'pickerBoySalesOrderMappingId': req.params.pickerBoyOrderMappingId }, { $set: { 'isDeleted': 1 } })
  
  
      //'isItemPicked':false,'isStartedPicking':false,isInvoice:false,delivery:'N/A,state:1 ->delivery_no failed
      // status code changes check required
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT,JSON.stringify(...req.body.delivery_detail['data']['remarks']) +','+MessageTypes.salesOrder.pickerBoySalesOrderDeliveryNumberAlreadyGenerated);
    } else {
   let isResponseUpdated = stoPickingDetailModel.findOneAndUpdate({
      '_id': stoPickingId
    }, {
      $set: {
        'picking_allocation_response': JSON.stringify(req.body.delivery_detail),
        'picking_allocation_request': JSON.stringify(obj),
        'isItemPicked': false,
        'isStartedPicking': false,
        'state': 1,
        'isDeleted': 1,
        'isSapError': 'DNE' //DNE->delivery_no error
      }
    })
      // //fixed require
      // await pickerBoyOrderItemMappingModel.update({ 'pickerBoySalesOrderMappingId': req.params.pickerBoyOrderMappingId }, { $set: { 'isDeleted': 1 } })
      //  Message pending
      info('some error generate delivery NO.')
      return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, req.body.delivery_detail['error']);
    }
  }
};
