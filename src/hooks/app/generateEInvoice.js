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
module.exports = async (req, res, next) => {
  
  
  if(req.body.customerDetail.success&&(req.body.customerDetail&&req.body.customerDetail['data']&&req.body.customerDetail['data'].gstNumber&&(req.body.customerDetail['data'].gstNumber!= ' '||req.body.customerDetail['data'].gstNumber!= '')))
    {
  try {


    info(`Hitting the SAP for Picking Allocation !`);
    // let data = req.body.data;
    // let OrderData = req.body.orderDetail
    // console.log('generate delivery',  req.body.orderDetail)
    // getting the data from the env
    let sapBaseUrl = process.env.sapBaseUrl;


    // let url = sapBaseUrl + 'waycool_qua/Picking_Allocation_Creation';
    let url = process.env.sapEInvoiceGenerate;

    console.log('Hitting SAP server for Generating the E-invoice *> ', url);
    var obj = {
      'request': {
        "invoice_no":  req.body.invoice_detail['data']['invoice_no']//"900000733"


      }
    }



    

    console.log('OrderData', JSON.stringify(obj))


    // get the data from SAP
    req.body.einvoicing_detail = await request.post(url)
      .send(obj)
      .timeout({
        response: 65000, // Wait 10 seconds for the server to start sending,
        deadline: 65000, // but allow 1 minute for the file to finish loading.
      })
      .retry(1)
      .then((res, body) => {

        // checking whether the user is authentic
        if (res.status === 200) {
          info('Document Generated Successfully !');
          console.log('e-invoice response',res.body.response)
          return {
            success: true,
            data: res.body.response,
          };
        } else {
          error('Error Updating Server !');
          return {
            success: false,
            error: 'Error Updating Server !'
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

    
    // else{
    //   next()
    // }
  } catch (e) {
    error(e);
    return {
      success: false,
      error: e
    };
  }
  
//   req.body.einvoicing_detail ={
//     "response": {
//         "irn_no": "10d28b29955efec355e5ce511ba859b527e484fe5b7e267cab89c4ce914aaed2",
//         "signed_invoice_no": "eyJhbGciOiJSUzI1NiIsImtpZCI6IkVEQzU3REUxMzU4QjMwMEJBOUY3OTM0MEE2Njk2ODMxRjNDODUwNDciLCJ0eXAiOiJKV1QiLCJ4NXQiOiI3Y1Y5NFRXTE1BdXA5NU5BcG1sb01mUElVRWMifQ.eyJkYXRhIjoie1wiQWNrTm9cIjoxMTIxMTAwODgyODAzNzIsXCJBY2tEdFwiOlwiMjAyMS0wNy0xNCAxNzowMjowMFwiLFwiSXJuXCI6XCIxMGQyOGIyOTk1NWVmZWMzNTVlNWNlNTExYmE4NTliNTI3ZTQ4NGZlNWI3ZTI2N2NhYjg5YzRjZTkxNGFhZWQyXCIsXCJWZXJzaW9uXCI6XCIxLjFcIixcIlRyYW5EdGxzXCI6e1wiVGF4U2NoXCI6XCJHU1RcIixcIlN1cFR5cFwiOlwiQjJCXCIsXCJSZWdSZXZcIjpcIk5cIn0sXCJEb2NEdGxzXCI6e1wiVHlwXCI6XCJJTlZcIixcIk5vXCI6XCI5MDAwMDA3MzNcIixcIkR0XCI6XCIxNC8wNy8yMDIxXCJ9LFwiU2VsbGVyRHRsc1wiOntcIkdzdGluXCI6XCIyOUFBRkNENTg2MlIwMDBcIixcIkxnbE5tXCI6XCJXQVlDT09MIEZPT0RTIEFORCBQUk9EVUNUUyBQUklWQVRFIExJTUlURURcIixcIlRyZE5tXCI6XCJXQVlDT09MIEZPT0RTIEFORCBQUk9EVUNUUyBQUklWQVRFIExJTUlURURcIixcIkFkZHIxXCI6XCIxNzQvNCAsa2FubmFtYW5nYWxhIHZpbGxhZ2UgQmlkcmFoYWxsaSBIXCIsXCJBZGRyMlwiOlwiQmlkcmFoYWxsaSBIb2JsaVwiLFwiTG9jXCI6XCIxNzQvNCAsa2FubmFtYW5nYWxhIHZpbGxhZ2UgQmlkcmFoYWxsaSBIXCIsXCJQaW5cIjo1NjAwNjcsXCJTdGNkXCI6XCIyOVwifSxcIkJ1eWVyRHRsc1wiOntcIkdzdGluXCI6XCIyOUFBRUZDOTYxNkwxWlpcIixcIkxnbE5tXCI6XCJUaGFuZ2FyYWogUHJvdmlzaW9uIEtPVklMQU1CQUtLQU1cIixcIlRyZE5tXCI6XCJUaGFuZ2FyYWogUHJvdmlzaW9uIEtPVklMQU1CQUtLQU1cIixcIlBvc1wiOlwiMjlcIixcIkFkZHIxXCI6XCJtZWRhdmFra2FtIG1haW4gcm9hZCxwZXJpeWFyIG5hZ2FyLCBCYW5nXCIsXCJMb2NcIjpcIk1PVU5UIFJPQUQgbWVkYXZha2thbSBtYWluIHJvYWQscGVyaXlhciBuYWdhciwgdmVsbGFrYWwgQmFuZ2Fsb3JlXCIsXCJQaW5cIjo1NjAwNjgsXCJTdGNkXCI6XCIyOVwifSxcIkRpc3BEdGxzXCI6e1wiTm1cIjpcIldBWUNPT0wgRk9PRFMgQU5EIFBST0RVQ1RTIFBSSVZBVEUgTElNSVRFRFwiLFwiQWRkcjFcIjpcIjE3NC80ICxrYW5uYW1hbmdhbGEgdmlsbGFnZSBCaWRyYWhhbGxpIEhcIixcIkFkZHIyXCI6XCJCaWRyYWhhbGxpIEhvYmxpXCIsXCJMb2NcIjpcIjE3NC80ICxrYW5uYW1hbmdhbGEgdmlsbGFnZSBCaWRyYWhhbGxpIEhcIixcIlBpblwiOjU2MDA2NyxcIlN0Y2RcIjpcIjI5XCJ9LFwiU2hpcER0bHNcIjp7XCJHc3RpblwiOlwiMjlBQUVGQzk2MTZMMVpaXCIsXCJMZ2xObVwiOlwiVGhhbmdhcmFqIFByb3Zpc2lvbiBLT1ZJTEFNQkFLS0FNXCIsXCJUcmRObVwiOlwiVGhhbmdhcmFqIFByb3Zpc2lvbiBLT1ZJTEFNQkFLS0FNXCIsXCJBZGRyMVwiOlwiTU9VTlQgUk9BRCBtZWRhdmFra2FtIG1haW4gcm9hZCxwZXJpeWFyXCIsXCJBZGRyMlwiOlwiTU9VTlQgUk9BRFwiLFwiTG9jXCI6XCJtZWRhdmFra2FtIG1haW4gcm9hZCxwZXJpeWFyIG5hZ2FyLCBCYW5nXCIsXCJQaW5cIjo1NjAwNjgsXCJTdGNkXCI6XCIyOVwifSxcIkl0ZW1MaXN0XCI6W3tcIkl0ZW1Ob1wiOjAsXCJTbE5vXCI6XCIxXCIsXCJJc1NlcnZjXCI6XCJOXCIsXCJQcmREZXNjXCI6XCJBUFBMRSBST1NFIC0gS0dcIixcIkhzbkNkXCI6XCIyMTA2OTA5OVwiLFwiUXR5XCI6MS4wLFwiVW5pdFwiOlwiS0dTXCIsXCJVbml0UHJpY2VcIjoxNzc5Ni42MixcIlRvdEFtdFwiOjE3Nzk2LjYyLFwiQXNzQW10XCI6MTc3OTYuNjIsXCJHc3RSdFwiOjE4LjAwLFwiQ2dzdEFtdFwiOjE2MDEuNjksXCJTZ3N0QW10XCI6MTYwMS42OSxcIlRvdEl0ZW1WYWxcIjoyMTAwMC4wMCxcIk9yZ0NudHJ5XCI6XCJJTlwifV0sXCJWYWxEdGxzXCI6e1wiQXNzVmFsXCI6MTc3OTYuNjIsXCJDZ3N0VmFsXCI6MTYwMS42OSxcIlNnc3RWYWxcIjoxNjAxLjY5LFwiT3RoQ2hyZ1wiOjIxLjAwLFwiVG90SW52VmFsXCI6MjEwMjEuMDB9fSIsImlzcyI6Ik5JQyJ9.Om4Wfhpen0yedfd3xyFAvVN0wuBMk1qegF_Y1UfBUiQL7QhErduSiZ4HxRVL22PkuoUta1WLZCSQENaIlZ0DyKJyyTfp042DKwY_ExMMs-rXtxW0jEY8M6DEUO_YiwYCWrlCjdNemkaUYNkhEs1zw5WENBTemzMOss6aVx91loPeL8kfqsuwlaeDiyqIe3sRDWhUNg6Pe8jiuI1hA7H4UQGJehSNujAZKpKpGMZ7cwfZ9XNM6mM7bNN1oPJ8LT_wGCUfwY2NJ7LtD8yu4gCwLf0gPYQSnb22_PlapcHAYoYC5HHiRrwHKhK5uQXqetDnLFIqwXmJ7wM3JhzAjObJRQ",
//         "signed_qr_code": "eyJhbGciOiJSUzI1NiIsImtpZCI6IkVEQzU3REUxMzU4QjMwMEJBOUY3OTM0MEE2Njk2ODMxRjNDODUwNDciLCJ0eXAiOiJKV1QiLCJ4NXQiOiI3Y1Y5NFRXTE1BdXA5NU5BcG1sb01mUElVRWMifQ.eyJkYXRhIjoie1wiU2VsbGVyR3N0aW5cIjpcIjI5QUFGQ0Q1ODYyUjAwMFwiLFwiQnV5ZXJHc3RpblwiOlwiMjlBQUVGQzk2MTZMMVpaXCIsXCJEb2NOb1wiOlwiOTAwMDAwNzMzXCIsXCJEb2NUeXBcIjpcIklOVlwiLFwiRG9jRHRcIjpcIjE0LzA3LzIwMjFcIixcIlRvdEludlZhbFwiOjIxMDIxLjAwLFwiSXRlbUNudFwiOjEsXCJNYWluSHNuQ29kZVwiOlwiMjEwNjkwOTlcIixcIklyblwiOlwiMTBkMjhiMjk5NTVlZmVjMzU1ZTVjZTUxMWJhODU5YjUyN2U0ODRmZTViN2UyNjdjYWI4OWM0Y2U5MTRhYWVkMlwiLFwiSXJuRHRcIjpcIjIwMjEtMDctMTQgMTc6MDI6MDBcIn0iLCJpc3MiOiJOSUMifQ.W59ELmXe0A1YskCYgtS803bfbu6EStirRS2KLzFXfWaA9EmQTTMjAp19oVblbjFeT7fxncBoRyKLLxBfopsIkWy_OVOxCC0AFFkxXUcaa20MDNT1gnoelNm7MqOVRvFxwWOwIvZkKnhjvYCSwVejt_R5JL-haw2qa3vlOpUjQECYsfZzVih14IFVxakosONMW91hCHHt4cliKk7jemsbxqnqZHmKWyGx9S8xEl6d4N9qfEg1BwWujR8a-PKdrQVMTfQyQ_8ojA4EAROFnZH_FQhV-tLWoZ9ZM2jfCberlw6IXVXvMDxny88Guyo5uV81nccMPgLdcO2LSrSyWAwicA",
//         "Acknowledgement_Number": 112110088280372,
//         "Acknowledgement_Date": "2021-07-14 17:02:00",
//         "error_details": [
//             {
//                 "error_code": "        1",
//                 "error_message": "IRN already exist",
//                 "error_source": "SAP"
//             }
//         ]
//     }
// }
 
 
  if (req.body.einvoicing_detail['success'] && !(req.body.einvoicing_detail['data']&&req.body.einvoicing_detail['data']['error_details']&&req.body.einvoicing_detail['data']['error_details'].length)) {
    info('E-invoicing generating sucessfully !')
    console.log(req.body.einvoicing_detail['data'])
    let isResponseAdded = await pickerBoyOrderMappingModel.findOneAndUpdate({
          '_id': req.params.pickerBoyOrderMappingId
        }, {
          $set: {
          
            
            'irn_no': req.body.einvoicing_detail['data']['irn_no'],
            'error_details': JSON.stringify(req.body.einvoicing_detail['data']['error_details']),
        "signed_invoice_no":req.body.einvoicing_detail['data']['signed_invoice_no'],
        "signed_qr_code":req.body.einvoicing_detail['data']['signed_qr_code'] ,
        "Acknowledgement_Number": req.body.einvoicing_detail['data']['Acknowledgement_Number'],
        "Acknowledgement_Date": req.body.einvoicing_detail['data']['Acknowledgement_Date'],
          },$push:{
            'Einvoice_response':JSON.stringify(req.body.einvoicing_detail),
            'Einvoice_request':JSON.stringify(obj)
          }
        }
          )
    return next()

  } else {
    
    console.log(req.body.einvoicing_detail['data'])
    if (req.body.einvoicing_detail['success'] && req.body.einvoicing_detail['data']['irn_no'] && req.body.einvoicing_detail['data']['error_details'][0]['error_message'] === "IRN already exist") {
      info('E-invoice Already Exist!')
      let isResponseAdded = await pickerBoyOrderMappingModel.findOneAndUpdate({
        '_id': req.params.pickerBoyOrderMappingId
      }, {
        $set: {
      'irn_no': req.body.einvoicing_detail['data']['irn_no'],
      'error_details': JSON.stringify(req.body.einvoicing_detail['data']['error_details']),
      "signed_invoice_no":req.body.einvoicing_detail['data']['signed_invoice_no'],
      "signed_qr_code":req.body.einvoicing_detail['data']['signed_qr_code'] ,
      "Acknowledgement_Number": req.body.einvoicing_detail['data']['Acknowledgement_Number'],
      "Acknowledgement_Date": req.body.einvoicing_detail['data']['Acknowledgement_Date'],
      },$push:{
        'Einvoice_response':JSON.stringify(req.body.einvoicing_detail),
        'Einvoice_request':JSON.stringify(obj)
      }
      })
      return next()
  
  
  
  
      // return Response.errors(req, res, StatusCodes.HTTP_CONFLICT,JSON.stringify(req.body.einvoicing_detail['error_details'][0]['error_message']) +','+`inr_code is: ${req.body.einvoicing_detail['irn_no']}`);
    } else {
    

      let isResponseAdded = await pickerBoyOrderMappingModel.findOneAndUpdate({
        '_id': req.params.pickerBoyOrderMappingId
      }, {
       $push:{
        'Einvoice_response':JSON.stringify(req.body.einvoicing_detail),
        'Einvoice_request':JSON.stringify(obj)
      }
      })
      info('some error generating E-invoicing.')
      // return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, req.body.einvoicing_detail['error']);
      return next()
    }
  }
}else{
  return next()
}

}
