// Controller
const axios = require('axios');
const moment = require('moment');
// Responses & others utils 

// Import purchase order coltroller
const POController = require('../../components/picker_app/purchase_order/purchase_order.controller')
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async () => {
  try {
    info(`CRON FOR SYNC PURCHASE ORDER!`);

    // getting the url 
    let baseUrl = process.env.WAYCOOL_SAP_BASE_URL,
    purchaseOrderGetEndPoint = process.env.PURCHASE_ORDER_END_POINT;

    let currentDate = moment().format('YYYY-MM-DD');

    
    const data = JSON.stringify({
      "request":{
        "from_date":[],
        "to_date":[],
        "plant":[],
        "po_number":[],
        "vendor_no":[],
        "delivery_from_date": currentDate,
        "delivery_to_date": currentDate
      }
    });

    
    const config = {
      method: 'get',
      url: `${baseUrl}${purchaseOrderGetEndPoint}`,
      headers: { 
        'Content-Type': 'application/json'
      },
      data : data
    };

    return await axios(config)
      .then(async function (response) {
        if(response && response.status == 200 && response.data.response.length > 0) {
          const isPurchaseOrderUpdated =  await POController.insertPurchaseOrderData(response.data.response);

          if(isPurchaseOrderUpdated.length > 0) {
            return { 
              success: true, 
              data: response.body
            };
          } else {
            return { 
              success: true, 
              data: "No new record found!"
            };
          }
        } else {
          return { 
            success: false, 
            data: "No response from server!"
          };
        }
      })
      .catch(function (err) {
        console.log(err);
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
    // catch any runtime error 
  } catch (e) {
    error(e);
    return {
      success: false,
      error: e
    };
  }
};