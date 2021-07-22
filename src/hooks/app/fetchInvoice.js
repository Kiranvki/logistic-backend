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
    info(`Getting Invoice from SAP!`);
    // console.log(req.body.invoice_detail['data']['invoice_no'])

    // console.log('generate delivery',  req.body.orderDetail)
    // getting the data from the env
    let sapBaseUrl = process.env.sapBaseUrl;
    

    // let url = sapBaseUrl + 'waycool_qua/Picking_Allocation_Creation';
    let url = process.env.sapInvoiceFetch;

    console.log('Hitting SAP server for Generating the Invoice *> ', url);
     obj = {
        "request": {
          
          "invoice_no":  req.body.invoice_detail['data']['invoice_no']
          // '0900000067'
         
          
        }
     }



    //  "0900000037" 

    // get the data from SAP
    
    // req.body.invoice_detail['data'] = [{
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
    //     }]

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
          info('Invoice Generated Successfully !');
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
    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.pickerBoySalesOrderFetchingInvoiceFailed);
  }
};
