// controllers 
// const SalesOrderCtrl = require('../../sales_order/sales_order/sales_order.controller');
// const PockerBoyCtrl = require('../../employee/picker_boy/picker_boy.controller');
// const AttendanceCtrl = require('../onBoard/app_picker_user_attendance/app_picker_user_attendance.controller');

const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/invoice_pickerboysalesorder_mapping.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const {
  error,
  info
} = require('../../../utils').logging;
//DMS API
const {
  getCustomerDetails
} = require('../../../inter_service_api/dms_dashboard_v1/v1');

// self apis
const {
  hitTallyCustomerAccountsSync,
  hitCustomerPaymentInvoiceSync,
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
class areaSalesManagerController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.salesOrder;
  }
  // internal function to create invoice and  picker_salesorder mapping
  create = async (createObj) => {
    try {
      info('Create Invoice and picker_salesorder Mapping !');

      // create a mapping for invoice and  picker_salesorder
      return Model.create(createObj)
        .then((res) => {
          if (res && !_.isEmpty(res))
            return {
              success: true,
              data: res
            };
          else return {
            success: false
          }
        }).catch((err) => {
          console.error(err);
          return {
            success: false,
            error: err
          }
        });

      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }



  // Internal Function to get the invoice details
  getInvoiceDetails = async (pickerBoySalesOrderMappingId) => {
    try {
      info('Get the Invoice  Details !');

      let invoiceData = await Model.aggregate([{
        $match: {
          'pickerBoySalesOrderMappingId': mongoose.Types.ObjectId(pickerBoySalesOrderMappingId)
        }
      },
      {
        $project: {
          'invoiceId': 1
        }
      },
      {
        $lookup: {
          from: 'invoicemasters',
          localField: "invoiceId",
          foreignField: "_id",
          as: 'invoiceDetails'
        }
      },
      ])

      // check if inserted 
      if (invoiceData && !_.isEmpty(invoiceData)) {
        return {
          success: true,
          data: invoiceData
        }
      } else {
        error('Error while getting the invoice data from pickerboy salesorder mapping id !');
        return {
          success: false
        }
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  // Internal Function get invoice  details
  getDetails = (pickerBoySalesOrderMappingId) => {
    try {
      info('Check invoice is created or not !');

      // get details 
      return Model.findOne({
        pickerBoySalesOrderMappingId: mongoose.Types.ObjectId(pickerBoySalesOrderMappingId),
        // status: 1,
        isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in Mapping DB!');
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
module.exports = new areaSalesManagerController();
