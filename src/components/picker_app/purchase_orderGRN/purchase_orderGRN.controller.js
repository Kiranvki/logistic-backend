// controllers
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');
const request = require('request-promise');

const BasicCtrl = require("../../basic_config/basic_config.controller");
const BaseController = require("../../baseController");
const Model = require("./models/purchase_orderGRN.model");
const poReceivingCtrl = require("../purchase_order_receiving_details/purchase_order_receiving_details.controller");
const poCtrl = require("../purchase_order/purchase_order.controller");

const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../utils").logging;
const moment = require("moment");
const { isArray } = require('lodash');
// self apis
const grnGenerateUrl = (process.env.sapBaseUrl||'')+(process.env.grnGenerateUrl || '');

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
      let pickerBoyId= mongoose.Types.ObjectId(req.user._id)  
      var dateToday = new Date();
      poDetails = poDetails.data[0];
      var poDeliveryDate= poDetails.delivery_date;
      var vendorInvoiceNo= req.body.vendorInvoiceNumber;
      let todaysDate  = moment().set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).format('YYYY-MM-DD');
      
      try{
         let sapGrnResponse= await this.hitSapApiOfGRN(poReceivingDetails,poDetails,vendorInvoiceNo);
         if(sapGrnResponse &&sapGrnResponse.response &&sapGrnResponse.response.flag=='S'){
           req.body.sapGrnNo=sapGrnResponse.response.material_document_no
         }else{//to-do remove comment
          info(sapGrnResponse,"sapGrnResponse-------")
           return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.grnNotGeneratedinSAP
        );
         }

        }catch(err){
//remove comment
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.grnNotGeneratedinSAP
        );
        
      }
      let fulfilmentStatus=1;
      for(let i = 0; i < poDetails.item.length; i++) {// adding recieved quantity in po order and gettinf fullfilment status
        let item = poDetails.item[i];
        let recievingItem= poReceivingDetails.item.filter((Ritem)=>{
          return item.material_no== Ritem.material_no
        });
        console.log("recievingItem---------------",recievingItem,item,recievingItem,item,(item.received_qty?item.received_qty:0),"(item.received_qty?item.received_qty:0)-------")
        if(recievingItem && recievingItem[0]){
          item.received_qty = (item.received_qty?item.received_qty:0)+recievingItem[0].received_qty

        }else{
          item.received_qty =item.received_qty?item.received_qty:0
        }
        if (item.quantity != item.received_qty) {
          fulfilmentStatus=2
        }
        console.log("recievingItem---------------",recievingItem,item,recievingItem,item,(item.received_qty?item.received_qty:0),"(item.received_qty?item.received_qty:0)-------")

        poDetails.item[i].pending_qty=item.quantity- (item.received_qty?item.received_qty:0);
      
      }
      var upcoming_delivery_date =req.body.upcoming_delivery_date;//format received 'yyyy-mm-dd'
      
      if(fulfilmentStatus==2&& !upcoming_delivery_date){
          return this.errors(
                    req,
                    res,
                    this.status.HTTP_CONFLICT,
                    this.messageTypes.upcomingDeliverDateMissing
                  );
      }else if(fulfilmentStatus==2){
        upcoming_delivery_date =moment(new Date(upcoming_delivery_date)).set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).format('YYYY-MM-DD')
        if(upcoming_delivery_date<todaysDate){
          return this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.pastDateNotAllowedforUDD
          );
        }
        if(poDetails.delivery_date_array && isArray(poDetails.delivery_date_array)){
          poDetails.delivery_date_array.push(upcoming_delivery_date)
        }else{
          poDetails.delivery_date_array=[poDetails.delivery_date,upcoming_delivery_date]
        }
        poDetails.delivery_date = upcoming_delivery_date;
      }
      for(let i = 0; i < poReceivingDetails.item.length; i++) {
        let item = poReceivingDetails.item[i];
        poReceivingDetails.item[i].pending_qty=item.quantity- (item.received_qty?item.received_qty:0);
      }

      let grnData = {
        sapGrnNo:req.body.sapGrnNo,
        poReceivingId:poReceivingDetails._id,
        po_number: poDetails.po_number,
        receivingStatus: fulfilmentStatus==1?1:2,
        fulfilmentStatus:fulfilmentStatus,
        document_date: poDetails.document_date,
        delivery_date:poDeliveryDate,
        delivery_date_array:poDetails.delivery_date_array,        
        poAmount: poReceivingDetails.total,
        netTotal: poReceivingDetails.netValue,
        totalTaxAmount: poReceivingDetails.totalTax,
        discount: poReceivingDetails.totalDiscount,
        generatedBy:pickerBoyId,
        item: poReceivingDetails.item,
        vendorInvoiceNo:vendorInvoiceNo,
        supplierDetails: {
          vendor_no: poDetails.vendor_no,
          vendor_name: poDetails.vendor_name,
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
        if(poDetails.sapGrnNo &&poDetails.sapGrnNo.length)
         poDetails.sapGrnNo.push({sapGrnNo:req.body.sapGrnNo,date:todaysDate,itemCount:poReceivingDetails.item.length, grnId:grnDetails._id,pickerBoyId:pickerBoyId})
         else
         poDetails.sapGrnNo=[{sapGrnNo:req.body.sapGrnNo,date:todaysDate,itemCount:poReceivingDetails.item.length, grnId:grnDetails._id,pickerBoyId:pickerBoyId}]
        await poCtrl.modifyPo({
          _id:poDetails._id,
          //poStatus ://to-do
        },{
          receivingStatus:fulfilmentStatus==1?1:2,
          fulfilmentStatus:fulfilmentStatus,
          item:poDetails.item,
          sapGrnNo:poDetails.sapGrnNo,
          delivery_date:poDetails.delivery_date,
          delivery_date_array:poDetails.delivery_date_array
        })

        await poReceivingCtrl.modifyPo({
            _id:poReceivingDetails._id,
            status:1
        },{
          receivingStatus:fulfilmentStatus==1?1:2,
          fulfilmentStatus:fulfilmentStatus,
          item:poReceivingDetails.item,
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
          this.messageTypes.grnNotGenerated
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
    try{

      let body=this.createRequestObject(poReceivingDetails,poDetails,vendorInvoiceNo)
      let options = {
        method: 'POST',
        uri: grnGenerateUrl,
        headers: {
          'Content-Type': 'application/json' 
      },
        json: true,
        body:body
      };
      console.log(options)

      return await request(options);
    }catch(err){
      console.log(err)
      throw err
    }

 
  }
  createRequestObject = (poReceivingDetails,poDetails,vendorInvoiceNo)=>{
    let itemArray=[]
    let todaysDate  = moment().set({
      h: 0,
      m: 0,
      s: 0,
      millisecond: 0
    }).format('YYYY-MM-DD');
    poReceivingDetails.item.forEach(item => {
      itemArray.push({
        "material_no": item.material_no,
        "movement_type": [],
        "quantity": item.received_qty,
        "po_number": poDetails.po_number,
        "po_item": item.item_no,
        "plant": item.plant,
        "storage_location": item.storage_location
    })
    }); 
    return {
      "request": {
          "posting_date": todaysDate,
          "document_date": todaysDate,
          "referance_document_no":poDetails.po_number ,
          "delivery_note":vendorInvoiceNo||121212,
          "bill_of_lading": vendorInvoiceNo||12121212,
          "header_txt": [],
          "Item":itemArray
      }
  }
  }
}

// exporting the modules
module.exports = new purchaseController();
