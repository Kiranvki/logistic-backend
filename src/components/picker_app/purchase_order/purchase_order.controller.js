// controllers 
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/purchase_order.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;
const moment = require('moment');
// self apis

// padding the numbers
const pad = (n, width, z) => {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};


// getting the model 
class purchaseController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.purchaseOrder;
  }


  getPOList = async (req,res) => {
    try {
      var page = req.query.page || 1,
      sortingArray = {},
      pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 10; });
      let skip = parseInt(page - 1) * pageSize;
      sortingArray['deliveryDate'] = -1;
      let todaysDate  = moment().set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0
      }).format('YYYY-MM-DD hh:mm:ss')
      info('Get Purchase order  details !',req.body,req.query,req.params);
      let query ={
        poStatus: 1,
        isDeleted: 0,
        // recievingStatus:{$ne:3}//to-do
        // expiryDate:{$gt:todaysDate}
      }
      if(req.query.poNumber){
        query.poNo = Number(req.query.poNumber);
      }
      // get the total PO
      let totalPO = await Model.countDocuments({
        ...query
      });
      var poList = await Model.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: "purchaseorderrecievingdetails",
            let: {
              id: "$_id",
              poRecStatus: "$recievingStatus",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$poId", "$$id"] },
                      { $eq: ["$$poRecStatus", 1] },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                },
              },
            ],
            as: "poDetails",
          },
        },
        {
          $project: {
            poNo: 1,
            supplierCode: 1,
            supplierName: 1,
            itemCount: { $size: "$orderItems" },
            poRecievingId: { $first: "$poDetails" },
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
      ]);
      // success 
      return this.success(req, res, this.status.HTTP_OK,
         {result: poList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalPO
          }
        }, this.messageTypes.poListFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

  getPODetails = async (req,res) => {
    try {

      info('Get Purchase order  details !',req.body,req.query,req.params);


      var poDetails= await  Model.aggregate([{
        $match:{
          poStatus: 1,
          isDeleted: 0,
          _id:mongoose.Types.ObjectId(req.params.id) 
        }
      },{
        $project: {
          poNo:1,
          supplierCode:1,
          supplierName:1,
          'orderItems._id':1,
          'orderItems.itemId':1,
          'orderItems.itemName':1,
          'orderItems.quantity':1,
          'orderItems.cost':1,
          'orderItems.mrp':1,
          "pendingQty":1,
          "recievedQty":1,
          "grnQty":1,
          "rejectedQty":1,
          deliveryDate:1
      }}
      ]);
      // success 
      return this.success(req, res, this.status.HTTP_OK, poDetails, this.messageTypes.poListFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

  startPickUP = async (req,res) => {
    try {
      info('Get Purchase order  details !',req.body,req.query,req.params);
      var poList= await  Model.findOne({
        status: 1,
        isDeleted: 0
      }).lean();
      // success 
      return this.success(req, res, this.status.HTTP_OK, poList, this.messageTypes.userDetailsFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }
  modifyPo =async(query,updateData)=>{
    try{
      var poDetails= await  Model.findOneAndUpdate(query,updateData,{
        newValue:true,useFindAndModify:false
      }
       );
      return {
        success: true,
        data: poDetails
      }
    }catch(err){
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }
  get =async (poId) =>{
    try{
      var poDetails= await  Model.aggregate([{
        $match:{
          isDeleted: 0,
          _id:mongoose.Types.ObjectId(poId) 
        }
      },{
        $project: {
          poNo:1,
          poDate:1,
          supplierCode:1,
          supplierName:1,
          supplierPhone:1,
          'orderItems':1,
          "pendingQty":1,
          "recievedQty":1,
          "grnQty":1,
          "rejectedQty":1,
          deliveryDate:1
      }}
      ]);
      return {
        success: true,
        data: poDetails
      }
    }catch(err){
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

  vendorDetails =async (req,res) =>{
    try {

      info('Get Purchase order  details !',req.body,req.query,req.params);


      var sellerDetails= await  Model.findOne({
          poStatus: 1,
          isDeleted: 0,
          _id:mongoose.Types.ObjectId(req.params.poId) 
        }
     , {
          poNo:1,
          supplierCode:1,
          supplierName:1,
          supplierPhone:1
      }
      ).lean();
      if(sellerDetails){
        sellerDetails.location='Banglore';
        sellerDetails.warehouse='Banglore';
        sellerDetails.address='Banglore';
      }else{
        sellerDetails={}
      }
      // success 
      return this.success(req, res, this.status.HTTP_OK, sellerDetails, this.messageTypes.poListFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

}

// exporting the modules 
module.exports = new purchaseController();
