// controllers 
const SalesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
const PockerBoyCtrl = require('../../employee/picker_boy/picker_boy.controller');
const AttendanceCtrl = require('../onBoard/app_picker_user_attendance/app_picker_user_attendance.controller');

const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/pickerboy_salesorder_items_mapping.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const {
  error,
  info
} = require('../../../utils').logging;

// self apis
const {

} = require('../../../third_party_api/self');

// We are using timeout because the Flow is synchronised and inorder to get the final report we need to wait for 5 secs 
class timeout {
  sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}

// getting the model 
class pickerSalesOrderMappingController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.salesOrder;
  }


  // do something 
  getUserDetails = async (req, res) => {
    try {
      info('Get Picker Boy Details !');
      let date = new Date();
      let endOfTheDay = moment(date).set({
        h: 24,
        m: 59,
        s: 0,
        millisecond: 0
      }).toDate();
      let startOfTheDay = moment(date).set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).toDate();

      // inserting the new user into the db
      let pickerBoyDetails = await PockerBoyCtrl.getPickerBoyFullDetails(req.user._id);

      // is inserted 
      if (pickerBoyDetails.success && !_.isEmpty(pickerBoyDetails.data)) {
        // fetch the attendance 
        let attendanceDetails = await AttendanceCtrl.getAttendanceDetailsForADay(req.user._id, startOfTheDay, endOfTheDay)
          .then((data) => {
            if (data.success) {
              let totalWorkingInMins = 0;
              // get the total working in mins 
              if (data.data.attendanceLog && data.data.attendanceLog.length)
                totalWorkingInMins = _.sumBy(data.data.attendanceLog, 'totalWorkingInMins')
              return {
                isFirstCheckedIn: data.data.attendanceLog ? data.data.attendanceLog.length ? 1 : 0 : 0,
                attendanceLog: data.data.attendanceLog ? data.data.attendanceLog.length ? data.data.attendanceLog[data.data.attendanceLog.length - 1] : [] : [],
                totalWorkingInMinsTillLastCheckOut: totalWorkingInMins
              }
            } else return {
              isFirstCheckedIn: 0,
              attendanceLog: {},
              totalWorkingInMinsTillLastCheckOut: 0
            };
          });

        // success response 
        return this.success(req, res, this.status.HTTP_OK, {
          ...pickerBoyDetails.data,
          attendanceDetails: attendanceDetails
        }, this.messageTypes.userDetailsFetchedSuccessfully);
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.userNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get user details 
  get = async (req, res) => {
    try {
      info('Zoho Details Controller !');

      // success 
      return this.success(req, res, this.status.HTTP_OK, req.body.userData, this.messageTypes.userDetailsFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get to do sales order details
  getToDoSalesOrder = async (req, res) => {
    try {
      info('Getting  Sales Order  Data !');
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt';
      let skip = parseInt(page - 1) * pageSize;
      let locationId = req.user.locationId || 0; // locationId 
      let cityId = req.user.cityId || 'N/A'; // cityId 

      //creating the object with query details to pass , in order to get the sales order details
      let salesQueryDetails = {
        page,
        pageSize,
        searchKey,
        sortBy,
        locationId,
        cityId
      }
      // inserting data into the db 
      let salesOrderData = await SalesOrderCtrl.getSalesOrderDetails(salesQueryDetails);
      // success
      if (salesOrderData.success) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: salesOrderData.data,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: salesOrderData.total
          }
        }, this.messageTypes.toDoSalesOrderDetailsFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchToDoSalesOrderDetails);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get details 
  getSalesOrder = async (req, res) => {
    try {
      info('SalesOrder GET DETAILS !');

      // get the sale Order Details
      let saleOrderDetails = req.body.saleOrderDetails;

      // check if inserted 
      if (saleOrderDetails && !_.isEmpty(saleOrderDetails)) return this.success(req, res, this.status.HTTP_OK, saleOrderDetails, this.messageTypes.salesOrderDetailsFetched);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderNotFound);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  //adding the new items after each scan
  addItems = async (req, res) => {
    try {
      info('Add items after scanning  !');
      let pickerBoySalesOrderMappingId = req.params.pickerBoySalesOrderMappingId || ''

      let dataToInsert = {
        'pickerBoySalesOrderMappingId': pickerBoySalesOrderMappingId,
        'itemId': req.body.itemId,
        'itemName': req.body.itemName,
        'salePrice': req.body.salePrice,
        'quantity': req.body.quantity,
        'suppliedQty': req.body.suppliedQty,
        'taxPercentage': req.body.taxPercentage,
        'discountPercentage': req.body.discountPercentage,
        'freeQty': req.body.freeQty,
        'itemAmount': req.body.itemAmount,
        'createdBy': req.user.email
      };

      // inserting data into the db 
      let isInserted = await Model.create(dataToInsert);

      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.itemAddedInsalesOrderAfterScan);
      } else {
        error('Error while adding in packing collection !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToAddItemInsalesOrderAfterScan);
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }




  // Internal Function get customer details 
  getAddedItemDetails = (pickerBoySalesOrderMappingId, itemId) => {
    try {
      info('Get Added Item details !');

      // get details 
      return Model.findOne({
        pickerBoySalesOrderMappingId: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId),
        itemId: itemId,
        isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching item in PickerBoy Item SalesOrder Mapping DB!');
          return {
            success: false
          }
        }
      }).catch(err => {
        error(err);
        return {
          success: false,
          error: err
        }
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


}

// exporting the modules 
module.exports = new pickerSalesOrderMappingController();
