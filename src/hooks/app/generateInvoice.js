// Controller
const request = require('../../utils/request');
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const BasicCtrl = require('../../components/basic_config/basic_config.controller');
const sales_orderController = require('../../components/sales_order/sales_order/sales_order.controller');
const moment = require('moment');
const pickerBoyOrderMappingModel = require('../../components/picker_app/pickerboy_salesorder_mapping/models/pickerboy_salesorder_mapping.model');
const pickerBoyOrderItemMappingModel = require('../../components/picker_app/pickerboy_salesorder_items_mapping/models/pickerboy_salesorder_items_mapping.model')
const stoPickingDetailsModel = require('../../components/picker_app/external_purchase_order/stock_transfer_picking_details/models/stock_transfer_picking_details.model');


// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
  let obj;
  try {
    info(`Hitting the SAP for Generating Invoice !`);
    // let data = req.body.data;
    // let OrderData = req.body.delivery_detail
    // console.log('generate delivery',  req.body.orderDetail)
    // getting the data from the env
    let sapBaseUrl = process.env.sapBaseUrl,
    requestFromUrl = req.url,
    deliveryDetail = req.body.deliveryDetail,
    billing_date = moment(new Date()).format('YYYY-MM-DD'),  //new Date()
    actual_gi_date = moment(new Date()).format('YYYY-MM-DD'),  //new Date()
    planned_gi_date = moment(new Date()).format('YYYY-MM-DD'),
    id = req.params.stoPickingId || req.params.pickerBoyOrderMappingId;


    // let url = sapBaseUrl + 'waycool_qua/Picking_Allocation_Creation';
    let url = process.env.sapInvoiceGenerate;  //new Date()

    console.log('Hitting SAP server for Generating the Invoice *> ', url);
   

    if(requestFromUrl.includes('/stocktransfer/generateInvoice/')){
      obj = {
        "request": {
          "delivery_no": deliveryDetail['delivery_no'],
          "reference_key": "1234",
          "billing_date": billing_date,
          "actual_gi_date": actual_gi_date,
          "planned_gi_date": planned_gi_date
        }
      }

    }else{
      obj = {
        "request": {
          "delivery_no": deliveryDetail['delivery_no'],
          "reference_key": "1234"
        }
      }
    }


    info(`Invoice Request Body - ${JSON.stringify(obj)}`)


    // get the data from SAP

    // req.body.invoice_detail = {
    //     "invoice_no": "0083000742",
    //     "billing_type": "X001",
    //     "sales_Org": 2000,
    //     "distribution_channel": 20,
    //     "division": 21,
    //     "billing_date": 20210201,
    //     "customer_price_group": "01",
    //     "customer_group": "01",
    //     "inco_terms": "FOB",
    //     "payment_terms": "WC08",
    //     "company_code": 2000,
    //     "account_assignment_group": "C1",
    //     "sold_to_party": "0002000002",
    //     "bill_to_party": "0002000002",
    //     "payer": "0002000002",
    //     "item": [
    //         {
    //             "item_no": "000010",
    //             "material": "CFB000000000000021",
    //             "item_category": "XTAN",
    //             "plant": 2000,
    //             "qty": "0.000 ",
    //             "uom": "PAK",
    //             "mrp_amount": "0.00 ",
    //             "discount_amount": "0.00 ",
    //             "net_price": "0.00 ",
    //             "taxable_value": "0.00 ",
    //             "cgst_pr": "0.00 ",
    //             "sgst_pr": "0.00 ",
    //             "igst_pr": "0.00 ",
    //             "ugst_pr": "0.00 ",
    //             "total_amount": "0.00 "
    //         }]
    //     }

    req.body.invoice_detail = await request.post(url)
      .send(obj)
      .timeout({
        response: 65000, // Wait 10 seconds for the server to start sending,
        deadline: 65000, // but allow 1 minute for the file to finish loading.
      })
      .retry(1)
      .then((res, body) => {

        // checking whether the user is authentic
        if (res.status === 200) {
          info('Invoice Generated Successfully !');
          console.log('invoice data', res.body.response)
          return {

            success: true,
            data: res.body.response,
          };
        } else {
          error('Error Updating Server !');
          return {
            success: false,
            error: 'Picking successful but invoice creation failed.Please check directly if invoice is created!'
          };
        }
        // catch any runtime error
      }, (err) => {
        error(err);
        if (err.timeout) {
          return {
            success: false,
            error: 'Picking Successful and invoice creation timed out.Please check directly if invoice is created.'
          };
        } else {
          return {
            success: false,
            error: err
          };
        }
      });

//   req.body.invoice_detail = {
//       'success':true
//     }
//   req.body.invoice_detail['data'] = {

   

//         "invoice_no": "0900000471",

//         "reference_key": 1234,

//         "flag": "S",

//         "remarks": [

//             "Document 0900000471 has been saved."

//         ]

    

// }



  if (req.body.invoice_detail['success'] && (req.body.invoice_detail['data'] ? req.body.invoice_detail['data']['invoice_no'] : false)) {
    req.body.invoiceRequestPayload = obj;
    req.body.deliveryNumber = req.body.deliveryDetail['delivery_no']
    return next()

  } else {
    if(requestFromUrl.includes('/stocktransfer/generateInvoice/')){

      let isResponseAdded = await stoPickingDetailsModel.findOneAndUpdate({
        '_id': id
      }, {
        $set: {
      
         
          'isItemPicked': false,
          'isStartedPicking': false,
          'state': 1,
          // 'isDeleted': 1,
          'isSapError': 'INVE' //INVE->invoice error
        },$push:{
          'invoiceResponsePayload': JSON.stringify(req.body.invoice_detail),
          'invoiceRequestPayload': JSON.stringify(obj)
        },$inc:{
          'invoiceRetryCount':1
        }
      })


    }else{
    let isResponseAdded = await pickerBoyOrderMappingModel.findOneAndUpdate({
      '_id': id
    }, {
      $set: {
        
        'isItemPicked': false,
        'isStartedPicking': false,
        'state': 1,
        // 'isDeleted': 1,
        'isSapError': 'INVE' //INVE->invoice error
      },$push:{
        'invoice_response': JSON.stringify(req.body.invoice_detail),
        'invoice_request': JSON.stringify(obj),
      }
        ,$inc:{
          'invoiceRetryCount':1
        }
      
    })
       //fixed require
       await pickerBoyOrderItemMappingModel.update({ 'pickerBoySalesOrderMappingId': req.params.pickerBoyOrderMappingId }, { $set: { 'isDeleted': 1 } })


  }

 
    //  Message pending
    //req.body.delivery_detail['error']
    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT,JSON.stringify(...req.body.invoice_detail['data']['remarks']) +','+ MessageTypes.salesOrder.pickerBoySalesOrderInvoiceGeneratedFailed);
  }

  

    // //     // catch any runtime error 
  } catch (e) {
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, 'Failed to generate STO invoice.');
    error(e);
    // return {
    //   success: false,
    //   error: e
    // };
  }
}


  // error response
  //   {

  //         "reference_key": 1234,
  //         "flag": "E",
  //         "remarks": [
  //             "Invoice has been initiated already for the delivery number800001000103170008",
  //             "Invoice has been initiated already for the delivery number800001000103170008",
  //             "Invoice has been initiated already for the delivery number800001000103170008",
  //             "Invoice has been initiated already for the delivery number800001000103170008"
  //         ]

  // }
  // req.body.invoice_detail = {}
  // console.log('sap invoice',req.body.invoice_detail)
  // req.body.invoice_detail['success'] =true;
  // && req.body.invoice_detail['data']['flag']==='S'

  // req.body.invoice_detail['data']={
  //   invoice_no: '0900000239',
  //   reference_key: 1234,
  //   flag: 'E',
  //   remarks: [ 'G/L account 12100001 is not defined in chart of accounts 1000' ]
  // }
