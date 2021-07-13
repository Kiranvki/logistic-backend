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
const { stockCheck } = require('../../responses/types/index');

// exporting the hooks 
module.exports = async (req,res,next) => {
    let obj;
  try {
    info(`Getting Invoice from SAP!`);
    // console.log(req.body.invoice_detail['data']['invoice_no'])

    // console.log('generate delivery',  req.body.orderDetail)
    // getting the data from the env
    let sapBaseUrl = process.env.sapBaseUrl,
    orderData = req.body.orderDetail['itemDetail'];
  
    

    // OrderData['itemDetail'].forEach(item => {
    //     obj['request']['item'].push({
   
    // let url = sapBaseUrl + 'waycool_qua/Picking_Allocation_Creation';
    let url =sapBaseUrl+ process.env.systemStockGet;
// console.log(req.body.orderDetail['itemDetail'])


    console.log('Hitting SAP server for Generating the Invoice *> ', url);
     obj = {
        'request': {
            'material_no': [
               
            ]
            //"plant": [],
            //"storage_location": []
        }
    }


    orderData.forEach(item => {
           obj['request']['material_no'].push(item['material_no'])

    })

    req.body.materialStockDetail = await request.post(url)
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


console.log('sap object material',obj)


  if(req.body.materialStockDetail['success']){
    return next()

  }else{
    //  Message pending
    //req.body.delivery_detail['error']
    error('Unable to fetch Stock Details.')
    return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, stockCheck.unableToFetchStockDetail);
  }
};
