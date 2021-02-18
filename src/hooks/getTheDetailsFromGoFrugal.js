const SalesOrderSyncCtrl = require('../components/sales_order/sales_order_sync/sales_order_sync.controller');

// Responses & others utils 
const moment = require('moment');
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const _ = require('lodash');

// logging 
const {
  error,
  info
} = require('../utils').logging;

// gofrugal apis 
const {
  getSalesOrderList
} = require('../third_party_api/goFrugal');

// We are using timeout because the Flow is synchronised and inorder to get the final report we need to wait for 5 secs 
class timeout {
  sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}
// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Get the Sales Order List !');


    // request variables 
    let city = req.params.city || 'chennai',
      accessToken = req.body.accessToken || '',
      url = req.body.url || '',
      page = 1,
      totalPages = 1,
      salesOrderList = [];

    let date = new Date()
    date.setDate(date.getDate() - 1)
    let n = date.toISOString().slice(0, 10);
    let startDate = n + " " +
      ("00").slice(-2) + ":" +
      ("00").slice(-2) + ":" +
      ("00").slice(-2)
    let endDate = n + " " +
      ("23").slice(-2) + ":" +
      ("55").slice(-2) + ":" +
      ("00").slice(-2)

    await SalesOrderSyncCtrl.markANewSalesOrderListSync(city);

    // returning the response 
    // Response.success(req, res, StatusCodes.HTTP_OK, {}, MessageTypes.salesOrder.salesOrderInsertInitiated);

    do {
      info(`Fetching Data from GoFrugal For Page ${page} out of ${totalPages}`);
      // check whether the document type already exist or not 
      let getSalesOrderListData = await getSalesOrderList(url, accessToken, city, page, startDate, endDate);

      // current page and total page
      if (getSalesOrderListData.currentPage && getSalesOrderListData.totalPages && !isNaN(getSalesOrderListData.currentPage) && !isNaN(getSalesOrderListData.totalPages)) {
        // check whether the document type already exists
        if (getSalesOrderListData.success) {
          info('GoFrugal data Retrieved'); // user doesnt exist 

          // mapping data 
          await Promise.all(
            getSalesOrderListData.data.map(async data => {
              await new Promise(async (resolve, reject) => {
                data.cityId = city;
                //  data.goFrugalId = data.id;
                data.latitude = data.latitude ? data.latitude.replace(/[^\d.-]/g, '') : null;
                data.longitude = data.longitude ? data.longitude.replace(/[^\d.-]/g, '') : null;
                data.location = {
                  type: 'Point',
                  coordinates: [!isNaN(data.longitude) ? data.longitude : null, !isNaN(data.latitude) ? data.latitude : null]
                };
                data.salesOrderCreatedAt = data.createdAt ? data.createdAt : moment(Date.now()).format('MM/DD/YYYY');
                data.salesOrderUpdatedAt = data.updatedAt ? data.updatedAt : moment(Date.now()).format('MM/DD/YYYY');
                return resolve(data);
              })
            })
          );

          // pushing it into the array
          salesOrderList = salesOrderList.concat(getSalesOrderListData.data);

          // initializing for next page 
          page = parseInt(getSalesOrderListData.currentPage) + 1;
          totalPages = parseInt(getSalesOrderListData.totalPages);

        } else {
          return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.goFrugalServerError);
        }
      } else {
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.goFrugalServerError);
      }

      // delay
      await new timeout().sleep(100); // 100 ns
    } while (page <= totalPages)

    // get only the unique customers name 
    salesOrderList = _.uniqBy(salesOrderList, 'onlineReferenceNo');

    // check whether the password matches
    if (salesOrderList && salesOrderList.length) {
      info('Total Customer Fetched here is ', salesOrderList.length);
      req.body.salesOrderList = salesOrderList;
      next();
    } else return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.goFrugalServerError);

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
