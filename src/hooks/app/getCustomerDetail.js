const Response = require('../../responses/response');
const _ = require('lodash');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const {
    error,
    info
} = require('../../utils').logging;
const {
  getCustomerDetails
} = require('../../inter_service_api/dms_dashboard_v1/v1')
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
module.exports = async (req, res, next) => {
  try {
    info('Get the customer details !');
    // console.log(req.body.invoice_detail['data'][0])
    // let invoiceDetail = req.body.invoice_detail['data'][0] || undefined,
    let customerCode = req.body.orderDetail['pickerBoySalesOrderMappingId']['salesOrderId']['ship_to_party'],

    
    

      customerDataFromMicroService = await getCustomerDetails(customerCode);
    
     if(customerDataFromMicroService){
        req.body.customerDetail =  {success:true,data:(customerDataFromMicroService&&customerDataFromMicroService.data)}
        next()
    }else{
        req.body.customerDetail =  {success:false,data:[]}
        next()
    }
   
  
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
