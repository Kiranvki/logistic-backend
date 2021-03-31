// Controller
const axios = require('axios');
const moment = require('moment');
// Responses & others utils 

// Import Sales order coltroller
const SOController = require('../../components/sales_order/sales_order/sales_order.controller')
const {
  error,
  info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async () => {
  try {
    info(`CRON FOR SYNC SALES ORDER!`);

    // getting the url 
    let baseUrl = process.env.SAP_BASE_URL,
      salesOrderGetEndPoint = process.env.SALES_ORDER_GET_ENDPOINT;

    let currentDate = moment().format('YYYY-MM-DD')

    
    var data = JSON.stringify({
      "request":{
        "from_date":[],
        "to_date":[],
        "delivery_from_date": currentDate,
        "delivery_to_date": currentDate,
        "sales_org":[]
      }
    });

    
    const config = {
      method: 'get',
      url: `${baseUrl}${salesOrderGetEndPoint}`,
      headers: { 
        'Content-Type': 'application/json'
      },
      data : data
    };

    return await axios(config)
      .then(async function (response) {
        if(response && response.status == 200 && response.data.response.length > 0) {
          const isSalesOrderUpdated =  await SOController.insertSalesOrderData(response.data.response);
          if(isSalesOrderUpdated.length > 0) {
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