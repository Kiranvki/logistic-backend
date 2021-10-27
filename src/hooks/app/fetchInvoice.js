// Controller
const request = require('../../utils/request');
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const BasicCtrl = require('../../components/basic_config/basic_config.controller');
   

// Responses & others utils 
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req,res,next) => {
    let obj;
  try {
    info(`Fetching Invoice from SAP!`);
    // console.log(req.body.invoice_detail['data']['invoice_no'])

    // console.log('generate delivery',  req.body.orderDetail)
    // getting the data from the env
    let sapBaseUrl = process.env.sapBaseUrl;
    

    // let url = sapBaseUrl + 'waycool_qua/Picking_Allocation_Creation';
    let url = process.env.sapInvoiceFetch;

    console.log('Hitting SAP server for Fetching the Invoice *> ', url);
     obj = {
        "request": {
          
          "invoice_no":  req.body.invoice_detail['data']['invoice_no']
          // '0900000067'
         
          
        }
     }



    //  "0900000037" 

    // get the data from SAP
    
  //   req.body.invoice_detail['data'] = [ {
  //     "invoice_no": "0900000640",
  //     "delivery_doc_no": "0800001278",
  //     "sales_order_no": "0300001475",
  //     "billing_type": "ZDOM",
  //     "document_currency": " ",
  //     "sales_Org": 5000,
  //     "distribution_channel": 50,
  //     "division": 50,
  //     "billing_date": "2021-06-16",
  //     "customer_price_group": "B4",
  //     "customer_group": "BD",
  //     "inco_terms": "FOB",
  //     "payment_terms": "WCAD",
  //     "payment_terms_description": "ADVANCE PAYMENT",
  //     "company_code": 1000,
  //     "account_assignment_group": "W1",
  //     "sold_to_party": "0001000826",
  //     "bill_to_party": "0001000826",
  //     "payer": "0001000826",
  //     "plant": 1000,
  //     "irn_no": "b20facd9ca2710cb8e02f6666c1f341eb3e6cef0b7dc62b5e527f6118a90dc9a",
  //     "signed_qrcode": "eyJhbGciOiJSUzI1NiIsImtpZCI6IkVEQzU3REUxMzU4QjMwMEJBOUY3OTM0MEE2Njk2ODMxRjNDODUwNDciLCJ0eXAiOiJKV1QiLCJ4NXQiOiI3Y1Y5NFRXTE1BdXA5NU5BcG1sb01mUElVRWMifQ.eyJkYXRhIjoie1wiU2VsbGVyR3N0aW5cIjpcIjI5QUFGQ0Q1ODYyUjAwMFwiLFwiQnV5ZXJHc3RpblwiOlwiMzNCSURQUDQ4MDNOMVo0XCIsXCJEb2NOb1wiOlwiOTAwMDAwNjQwXCIsXCJEb2NUeXBcIjpcIklOVlwiLFwiRG9jRHRcIjpcIjE2LzA2LzIwMjFcIixcIlRvdEludlZhbFwiOjIxMDAwLjAwLFwiSXRlbUNudFwiOjEsXCJNYWluSHNuQ29kZVwiOlwiMjEwNjkwOTlcIixcIklyblwiOlwiYjIwZmFjZDljYTI3MTBjYjhlMDJmNjY2NmMxZjM0MWViM2U2Y2VmMGI3ZGM2MmI1ZTUyN2Y2MTE4YTkwZGM5YVwiLFwiSXJuRHRcIjpcIjIwMjEtMDctMDUgMTg6MTU6MDBcIn0iLCJpc3MiOiJOSUMifQ.Bn9KQ4m1Nu-rQ6HEddPg7xbcUqb4Dm5lIIXQl0bgyc59FLVoK0XpAddBY-bJ0LvIMJq6T1zPq7VpR9Doqw_kA5tXD_QyrvSUwCAuLs5DNVvGYRNJWD0yeJhWL19Uhs50XqGdYGtxAcfP2TqNqPz0fFlJPtKN1w07dk3v0CN3dlJXEL8VNt3ivzk6EM3-gNTSVcofzaqZP_0mBStJeTk0ThX4aEp62O1mvD3UJ80h6IBmks6Y3KoYhYBWqmUBj8GSXj224WOWs6bEcnG2lO1Oj9zPCqZ21h1HnkSN5izl7cHZrCWUv8fVmqVN0GEUCyb90tjg_Mk48C3iifKehA8Iog",
  //     "acknowledgement_number": 112110087062113,
  //     "irn_status": "ACT",
  //     "item": [
  //         {
  //             "item_no": "000010",
  //             "material": "WC0000000000000010",
  //             "batch": "TEST2",
  //             "item_category": "ZTAN",
  //             "plant": 1000,
  //             "qty": "20.000",
  //             "uom": "KG",
  //             "unit_price": "1000.00",
  //             "mrp_amount": "40000.00",
  //             "discount_amount": "0.00",
  //             "net_price": "20000.00",
  //             "taxable_value": "1000.00",
  //             "cgst_pr": "0.00",
  //             "cgst_value": "0.00",
  //             "sgst_pr": "0.00",
  //             "sgst_value": "0.00",
  //             "igst_pr": "5.00",
  //             "igst_value": "1000.00",
  //             "ugst_pr": "0.00",
  //             "ugst_value": "0.00",
  //             "total_amount": "21000.00"
  //         }
  //     ]
  // }]

    req.body.invoice_detail = await request.post(url)
      .send(obj)
      .timeout({
        response: 65000, // Wait 10 seconds for the server to start sending,
        deadline: 65000, // but allow 1 minute for the file to finish loading.
      })
      .retry(1)
      .then((res,body) => {
        
        // checking whether the user is authentic
        if (res.status === 200) {
          info('Invoice Fetched Successfully !');
          console.log('invoice data',res.body.response)
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

//     // catch any runtime error 
  } catch (e) {
    error(e);
    return {
      success: false,
      error: e
    };
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
console.log('sap invoice',obj)
// req.body.invoice_detail['success'] =true;
// && req.body.invoice_detail['data']['flag']==='S'

  if(req.body.invoice_detail['success']){
    return next()

  }else{
    //  Message pending
    //req.body.delivery_detail['error']
    if(req.body.invoice_detail==undefined){
      return Response.errors(req, res, StatusCodes.HTTP_FOUND, JSON.stringify({status:true,invoiceId:req.body.invoice_detail['data']['invoice_no'],invoiceStatus:'fetchfailed',"isInvoiceFetch":true}));
    }
      
      // return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, JSON.stringify({status:true,invoiceId:req.body.invoice_detail['data']['invoice_no'],invoiceStatus:'fetchfailed',"isInvoiceFetch":true}));
    // }
    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.pickerBoySalesOrderFetchingInvoiceFailed);
  }
};
