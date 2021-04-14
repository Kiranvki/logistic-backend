// Controller
const request = require('../../utils/request');
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const BasicCtrl = require('../../components/basic_config/basic_config.controller');
const pickerBoyOrderMappingModel = require('../../components/picker_app/pickerboy_salesorder_mapping/models/pickerboy_salesorder_mapping.model');
const pickerBoyOrderItemMappingModel = require('../../components/picker_app/pickerboy_salesorder_items_mapping/models/pickerboy_salesorder_items_mapping.model')
   

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req,res,next) => {
  try {
    info(`Hitting the SAP for Picking Allocation !`);
    let data = req.body.data;
    let OrderData = req.body.orderDetail
    // console.log('generate delivery',  req.body.orderDetail)
    // getting the data from the env
    let sapBaseUrl = process.env.sapBaseUrl;
    

    // let url = sapBaseUrl + 'waycool_qua/Picking_Allocation_Creation';
    let url = process.env.sapPickingAllocation;

    console.log('Hitting SAP server for Generating the delivery Number *> ', url);
    var obj = { 'request':{
      'sales_order_no': OrderData['pickerBoySalesOrderMappingId']['sales_order_no'],
      'delivery_date': OrderData['pickerBoySalesOrderMappingId']['delivery_date'],
      'shipping_point': OrderData['pickerBoySalesOrderMappingId']['shipping_point'],
      'item':[]
      
    }
    }


      OrderData['itemDetail'].forEach(item => {
        obj['request']['item'].push({
          'sales_order_item_no':item['item_no'],
          'delivery_quantity':(item['pickedQuantity']).toString() ,
          'uom':item['uom']



        })
      });

    //  var obj = {"request":{"sales_order_no":"0300000413","delivery_date":"2021-04-08","shipping_point":"1004","item":[{"sales_order_item_no":"10","delivery_quantity":"2","uom":"PAK"}]}}

console.log('OrderData',JSON.stringify(obj))
      

    // get the data from SAP
    req.body.delivery_detail = await request.post(url)
      .send(obj)
      .timeout({
        response: 30000, // Wait 10 seconds for the server to start sending,
        deadline: 30000, // but allow 1 minute for the file to finish loading.
      })
      .retry(1)
      .then((res,body) => {
        
        // checking whether the user is authentic
        if (res.status === 200) {
          info('Document Generated Successfully !');
          return {
            success: true,
            data: res.body.response,
          };
        } else {
          error('Error Updating Server !');
          return {
            success: false,
            error:'Error Updating Server !'
          };
        }
        // catch any runtime error
      }, (err) => {
        error(err);
        if (err.timeout) {
          return {
            success: false,
            error: 'API timeout'
          };
        } else {
          return {
            success: false,
            error: err
          };
        }
      });
   
    // 300000442
    //800000515
    
   
    // req.body.delivery_detail = {"data":{"delivery_no":"0800000056","flag":"S","remarks":["0800000056  has been saved"]}}
    // catch any runtime error 
  } catch (e) {
    error(e);
    return {
      success: false,
      error: e
    };
  }
  // req.body.delivery_detail['success']
  console.log('delivery_data',req.body.delivery_detail)
// console.log('sap',req.body.delivery_detail['success'],req.body.delivery_detail['data']['flag']==='S')
  if(req.body.delivery_detail['success'] && req.body.delivery_detail['data']['flag']==='S'){
    info('Order number generating sucessfully !')
     next()

  }else{
if(req.body.delivery_detail['success'] && req.body.delivery_detail['data']['flag']==='E'){
  info('Failed to generate delivery NO.')
  let isResponseAdded = await pickerBoyOrderMappingModel.findOneAndUpdate({
    '_id':req.params.pickerBoyOrderMappingId},{
    $set:{
    'picking_allocation_response':JSON.stringify(req.body.delivery_detail),
    'picking_allocation_request':JSON.stringify(obj),
    'isItemPicked':false,
    'isStartedPicking':false,
    'state':1,
    'isDeleted':1,
    'isSapError':'DNE' //DNE->delivery_no error
  }})
  //fixed require
  await pickerBoyOrderItemMappingModel.update({ 'pickerBoySalesOrderMappingId':req.params.pickerBoyOrderMappingId},{$set:{'isDeleted':1 }})
  //'isItemPicked':false,'isStartedPicking':false,isInvoice:false,delivery:'N/A,state:1 ->delivery_no failed
  // status code changes check required
return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR,JSON.stringify(...req.body.delivery_detail['data']['remarks']) +','+MessageTypes.salesOrder.pickerBoySalesOrderDeliveryNumberAlreadyGenerated);
}else{
  let isResponseAdded = await pickerBoyOrderMappingModel.findOneAndUpdate({
    '_id':req.params.pickerBoyOrderMappingId},{
    $set:{
    'picking_allocation_response':JSON.stringify(req.body.delivery_detail),
    'picking_allocation_request':JSON.stringify(obj),
    'isItemPicked':false,
    'isStartedPicking':false,
    'state':1,
    'isDeleted':1,
    'isSapError':'DNE' //DNE->delivery_no error
  }})
  //fixed require
  await pickerBoyOrderItemMappingModel.update({ 'pickerBoySalesOrderMappingId':req.params.pickerBoyOrderMappingId},{$set:{'isDeleted':1 }})
    //  Message pending
    info('some error generate delivery NO.')
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, req.body.delivery_detail['error']);
  }
}
};
