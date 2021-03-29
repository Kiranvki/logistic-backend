// controllers
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

const BasicCtrl = require("../../basic_config/basic_config.controller");
const BaseController = require("../../baseController");
const Model = require("./models/purchase_orderGRN.model");
const poReceivingCtrl = require("../purchase_order_receiving_details/purchase_order_receiving_details.controller");
const poCtrl = require("../purchase_order/purchase_order.controller");

const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../utils").logging;
const moment = require("moment");
// self apis

// padding the numbers
const pad = (n, width, z) => {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

// getting the model
class purchaseController extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.purchaseOrder;
  }

  grnDetails = async (req, res) => {
    try {
      info("Get Purchase order GRN details !", req.body, req.query, req.params);

      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        req.body.grnDetails,
        this.messageTypes.poListFetched
      );

      // catch any runtime error
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  generateGRN = async (req, res) => {
    try {
      let poReceivingDetails = req.body.poReceivingDetails;
      let poDetails = await poCtrl.get(poReceivingDetails.poId);
      var dateToday = new Date();
      poDetails = poDetails.data[0];
      var vendorInvoiceNo= req.body.vendorInvoiceNumber;
      
      try{
        //  let sapGrnResponse= await this.hitSapApiOfGRN(poReceivingDetails,poDetails,vendorInvoiceNo);
        //   info(sapGrnResponse)
        }catch(err){
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.invoiceNotCreated
        );
        
      }
      let fulfilmentStatus=1;
      for(let i = 0; i < poDetails.orderItems.length; i++) {// adding recieved quantity in po order and gettinf fullfilment status
        let item = poDetails.orderItems[i];
        let recievingItem= poReceivingDetails.orderItems.filter((Ritem)=>{
          return item.itemId== Ritem.itemId
        });
        if(recievingItem && recievingItem[0]){
          item.receivedQty = (item.receivedQty?item.receivedQty:0)+recievingItem[0].receivedQty

        }else{
          item.receivedQty =item.receivedQty?item.receivedQty:0
        }
        if (item.quantity != item.receivedQty) {
          fulfilmentStatus=2
        }
        poDetails.orderItems[i].pendingQty=item.quantity- (item.receivedQty?item.receivedQty:0);
      
      }
      for(let i = 0; i < poReceivingDetails.orderItems.length; i++) {
        let item = poReceivingDetails.orderItems[i];
        poReceivingDetails.orderItems[i].pendingQty=item.quantity- (item.receivedQty?item.receivedQty:0);
      }

      let grnData = {
        poReceivingId:poReceivingDetails._id,
        poNo: poDetails.poNo,
        receivingStatus: fulfilmentStatus==1?1:2,
        fulfilmentStatus:fulfilmentStatus,
        poDate: poDetails.poDate,
        deliveryDate: poDetails.deliveryDate,
        poAmount: poReceivingDetails.total,
        netTotal: poReceivingDetails.netValue,
        totalTaxAmount: poReceivingDetails.totalTax,
        discount: poReceivingDetails.totalDiscount,
        generatedBy: req.user.email,
        orderItems: poReceivingDetails.orderItems,
        vendorInvoiceNo:vendorInvoiceNo,
        supplierDetails: {
          supplierCode: poDetails.supplierCode,
          supplierName: poDetails.supplierName,
          supplierPhone: poDetails.supplierPhone,
        },
      };
      var grnDetails = await Model.create(grnData);
      let grnNo = `GRN${dateToday.getFullYear()}${pad(
        parseInt(dateToday.getMonth() + 1),
        2
      )}${pad(parseInt(dateToday.getDay()), 2)}${pad(
        parseInt(grnDetails.sequence % 99999),
        5
      )}`;

      let isUpdated = await Model.updateOne(
        {
          _id: mongoose.Types.ObjectId(grnDetails._id),
        },
        {
          grnNo: grnNo,
        },
        {
          lean: true,
          multi: false,
          upsert: false,
          new: true,
          useFindAndModify: false,
        }
      );

      if (grnDetails && !_.isEmpty(grnDetails)) {
        info("GRN Successfully Created !");
        //add Invoice no.
        grnDetails.grnNo = grnNo;
        grnDetails.poVendorNumber = "NA";
        grnDetails.poVendorDate = "NA";

        await poCtrl.modifyPo({
          _id:poDetails._id,
          poStatus :1
        },{
          receivingStatus:fulfilmentStatus==1?1:2,
          fulfilmentStatus:fulfilmentStatus,
          orderItems:poDetails.orderItems
        })

        await poReceivingCtrl.modifyPo({
            _id:poReceivingDetails._id,
            status:1
        },{
          receivingStatus:fulfilmentStatus==1?1:2,
          fulfilmentStatus:fulfilmentStatus,
          orderItems:poReceivingDetails.orderItems,
          isDeleted:1
        })
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          grnDetails,
          this.messageTypes.invoiceCreated
        );
      } else
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.invoiceNotCreated
        );
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
    }
  };

  get = async (query) => {
    try {
      var poGRNDetails = await Model.findOne(query);
      if (poGRNDetails) {
        return {
          success: true,
          data: poGRNDetails,
        };
      } else {
        return {
          success: true,
          recordNotFound: 1,
        };
      }
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  hitSapApiOfGRN = async(poReceivingDetails,poDetails,vendorInvoiceNo)=>{
    let options = {
      method: 'GET',
      uri: 'http://uat.apps.waycool.in:3001/api/v1/warehouse/'+req.user.warehouseId,
      headers: {
        'x-access-token': req.user.token,
        'Content-Type': 'application/json' 
    },
      json: true
    };
    createRequestObject(poReceivingDetails,poDetails,vendorInvoiceNo)
    let response = await request(options);

 
  }
  createRequestObject = (poReceivingDetails,poDetails,vendorInvoiceNo)=>{
    let itemArray=[]
    let todaysDate  = moment().set({
      h: 0,
      m: 0,
      s: 0,
      millisecond: 0
    }).format('YYYY-MM-DD')
    poReceivingDetails.orderItems.forEach(item => {
      itemArray.push({
        "material_no": item.material_no,
        "movement_type": [101],
        "quantity": item.quantity,
        "po_number": poDetails.poNo,
        "po_item": item.receivedQty,
        "plant": item.plant,
        "storage_location": item.storage_location
    })
    }); 
    return {
      "request": {
          "posting_date": todaysDate,
          "document_date": todaysDate,
          "referance_document_no":poDetails.poNo ,
          "delivery_note":vendorInvoiceNo,
          "bill_of_lading": vendorInvoiceNo,
          "header_txt": [],
          "item":itemArray
      }
  }
  }
}

// exporting the modules
module.exports = new purchaseController();
