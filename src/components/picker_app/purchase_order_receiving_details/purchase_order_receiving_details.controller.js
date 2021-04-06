// controllers
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

const BasicCtrl = require("../../basic_config/basic_config.controller");
const BaseController = require("../../baseController");
const Model = require("./models/purchase_order_receiving_details.model");
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

  startPickUP = async (req, res) => {
    try {
      info("Add SalesOrder in Picking state a !");

      // get the sale Order Details
      let poDetails = req.body.poDetails;
      poDetails.item = poDetails.item.filter(item => {
        return item.quantity!=item.received_qty
      });
      poDetails.item.forEach(item => {
        item.quantity= (item.pending_qty?item.pending_qty:item.quantity);
        item.received_qty=0;
      });

      let dataToInsert = {
        poId: poDetails._id,
        pickerBoyId: mongoose.Types.ObjectId(req.user._id),
        createdBy: req.user.email,
        receivingDate: new Date(),
        item: poDetails.item,
      };

      // inserting data into the db
      let isInserted = await Model.create(dataToInsert);
      let poUpdateDetails = await poCtrl.modifyPo(
        { _id: poDetails._id ,
          status:1,
          isDeleted:0
        },
        { receivingStatus: 4 }
      );

      // check if inserted
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          isInserted,
          this.messageTypes.startedReceiving
        );
      } else {
        error("Error while adding in packing collection !");
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.startedNotReceiving
        );
      }
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

  poReceivingList = async (req, res) => {
    try {
      var poReceivingId = req.params.poReceivingId;
      info(
        "Get Purchase order  receiving details !",
        req.body,
        req.query,
        req.params
      );
      let query = {
        _id: mongoose.Types.ObjectId(poReceivingId),
        isDeleted: 0,
      };
      var poList = await Model.findOne(query).populate({
        path: "poId",
        select: { po_number: 1, vendor_no: 1, vendor_name: 1, delivery_date: 1 },
      });
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        { result: poList },
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

  receivePOItem = async (req, res) => {
    try {
      var material_no = req.params.material_no;
      var poReceivingId = req.body.poReceivingId;
      var received_qty = req.body.received_qty;
      var remarks =req.body.remarks;
      var date_of_manufacturing= req.body.date_of_manufacturing||new Date();
      if(date_of_manufacturing){
        date_of_manufacturing  = moment(new Date(date_of_manufacturing)).set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).format('YYYY-MM-DD hh:mm:ss')
      }

      info("Receiving PO item!");
      let query = {
        _id: mongoose.Types.ObjectId(poReceivingId),
        "item._id": mongoose.Types.ObjectId(material_no),
      };
      let updateData = {
        "item.$.received_qty": received_qty,
        "item.$.date_of_manufacturing": date_of_manufacturing,
        // "item.$.is_edited":1

      };
      if(remarks){
        updateData["item.$.remarks"] =remarks;
      }else{
        updateData["item.$.remarks"] ='';

      }
      var updatedPO = await Model.findOneAndUpdate(query, updateData, {
        newValue: true,
        useFindAndModify: false,
      });
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        this.messageTypes.receivePOItem
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

  getPOReceivingDetails = async (poId) => {
    try {
      info("Get POReceiving details !");

      // get details
      return Model.find({
        poId: poId,
        isDeleted: 0,
      })
        .lean()
        .then((res) => {
          if (res && res.length) {
            return {
              success: true,
              data: res,
            };
          } else {
            error("Error Searching Data in po DB!");
            return {
              success: false,
            };
          }
        })
        .catch((err) => {
          error(err);
          return {
            success: false,
            error: err,
          };
        });

      // catch any runtime error
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  basketList = async (req, res) => {
    try {
      var poReceivingId = req.params.poReceivingId;
      info(
        "Get Purchase order  receiving details !",
        req.body,
        req.query,
        req.params
      );
      let query = {
        _id: mongoose.Types.ObjectId(poReceivingId),
        isDeleted: 0,
        'item.received_qty': {$gt:0},//to-do not workinfg properly
        // 'item.is_edited': 1//to-do not workinfg properlu
      };
      var bucketList = await Model.aggregate(
        [{$match:query},
          {
            $lookup: {
              from: "purchase_order",
              let: {
                id: "$poId",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$id"] },
                        { $eq: ["$receivingStatus", 4] },
                        { $eq: ["$isDeleted", 0] },
  
                        // { $gt: ["$item.quantity", "$item.received_qty"] },//not working need to check later //to-do
                      ],
                    },
                  },
                },
  
                { $limit: 1 },
                {
                  $project: {
                    _id: 1,
                    po_number:1
                  },
                },
              ],
              as: "poDetails",
            },
          },
          {
            $unwind: {
              path: "$poDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              total: {
                $sum: {
                  $map: {
                    input: "$item",
                    as: "item",
                    in: {
                      $round: [
                        { $multiply: ["$$item.net_price", "$$item.received_qty"] },
                        4,
                      ],
                    },
                  },
                },
              },

              totalTax: {
                $sum: {
                  $map: {
                    input: "$item",
                    as: "item",
                    in: {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ["$$item.itemTax", "$$item.quantity"] },
                            "$$item.received_qty",
                          ],
                        },
                        4,
                      ],
                    },
                  },
                },
              },
              totalDiscount: {
                $sum: {
                  $map: {
                    input: "$item",
                    as: "item",
                    in: {
                      $round: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                "$$item.discount_amount",
                                "$$item.quantity",
                              ],
                            },
                            "$$item.received_qty",
                          ],
                        },
                        4,
                      ],
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              "item":1,
              totalDiscount:1,
              totalTax:1,
              total:1,
              poDetails:1
            },
          }
        ]
      );
      if(bucketList && bucketList[0] && bucketList[0].item && bucketList[0].item.length){
        bucketList[0].basketTotal = bucketList[0].total+bucketList[0].totalDiscount-bucketList[0].totalTax
        bucketList[0].netWeight = 0;
        bucketList[0].vendorInvoiceNo = 'NA'

        // success
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          { result: bucketList },
          this.messageTypes.bucketListFetchedSuccessfully
        );
      }else{
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.emptyBucketList);
      }

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
      var poReceivingId = req.params.poReceivingId;
      info(
        "Get Purchase order  receiving details !",
        req.body,
        req.query,
        req.params
      );
      var poReceivingId= req.params.poReceivingId;
      var vendorInvoiceNo = req.body.vendorInvoiceNo;
      let query = {
        _id: mongoose.Types.ObjectId(poReceivingId),
        isDeleted: 0,
      };
      var bucketList = await Model.aggregate(
        [{$match:query},
          {
            $addFields: {
              total: {
                $sum: {
                  $map: {
                    input: "$item",
                    as: "item",
                    in: {
                      $round: [
                        { $multiply: ["$$item.net_price", "$$item.received_qty"] },
                        4,
                      ],
                    },
                  },
                },
              },

              totalTax: {
                $sum: {
                  $map: {
                    input: "$item",
                    as: "item",
                    in: {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ["$$item.itemTax", "$$item.quantity"] },
                            "$$item.received_qty",
                          ],
                        },
                        4,
                      ],
                    },
                  },
                },
              },
              totalDiscount: {
                $sum: {
                  $map: {
                    input: "$item",
                    as: "item",
                    in: {
                      $round: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                "$$item.discount_amount",
                                "$$item.quantity",
                              ],
                            },
                            "$$item.received_qty",
                          ],
                        },
                        4,
                      ],
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              "item._id": 1,
              "item.material_no": 1,
              "item.material_description": 1,
              "item.quantity": 1,
              "item.net_price": 1,
              "item.mrp": 1,
              "item.received_qty": 1,
              "item.mrp_amount": 1,
              totalDiscount:1,
              totalTax:1,
              total:1
            },
          }
        ]
      );

      if(bucketList && bucketList[0] && bucketList[0].item && bucketList[0].item.length){
        bucketList[0].basketTotal = bucketList[0].total+bucketList[0].totalDiscount-bucketList[0].totalTax
        // success
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          { result: bucketList },
          this.messageTypes.bucketListFetchedSuccessfully
        );
      }else{
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.emptyBucketList);
      }
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
  get =async (query) =>{
    try{
      var poReceivingDetails= await  Model.aggregate([{
        $match:query
      },{
        $project: {
          poId:1,
          'item':1,
          'pickerBoyId':1,
          'receivingStatus':4,
      }}
      ]);
      return {
        success: true,
        data: poReceivingDetails
      }
    }catch(err){
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }
  getReceivingItem =async (poReceivingId,itemId) =>{
    try{
      var poReceivingDetails= await  Model.aggregate([{
        $match:{ 
          _id: mongoose.Types.ObjectId(poReceivingId),
          "item._id": mongoose.Types.ObjectId(itemId),
          receivingStatus:4
        }
      },
      { $unwind : "$item" },
      { $match : {
        "item._id": mongoose.Types.ObjectId(itemId)
      }},
      {
        $project: {
          poId:1,
          'item':1,
          'pickerBoyId':1,
          'receivingStatus':4,
      }}
      ]);
      return {
        success: true,
        data: poReceivingDetails
      }
    }catch(err){
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

 getForGrnGeneration = async(poReceivingId)=>{
  try{
    let query = {
      _id: mongoose.Types.ObjectId(poReceivingId),
      isDeleted: 0,
      // 'item.received_qty':{$gt:0}// not adding this as we need filtered and unfiltered both list
    };
    //calculate net value also when 
    var poReceivingDetails= await  Model.aggregate( [{$match:query},
      {
        $addFields: {
          total: {
            $sum: {
              $map: {
                input: "$item",
                as: "item",
                in: {
                  $round: [
                    { $multiply: ["$$item.net_price", "$$item.received_qty"] },
                    4,
                  ],
                },
              },
            },
          },
  
          totalTax: {
            $sum: {
              $map: {
                input: "$item",
                as: "item",
                in: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$$item.itemTax", "$$item.quantity"] },
                        "$$item.received_qty",
                      ],
                    },
                    4,
                  ],
                },
              },
            },
          },
          totalDiscount: {
            $sum: {
              $map: {
                input: "$item",
                as: "item",
                in: {
                  $round: [
                    {
                      $multiply: [
                        {
                          $divide: [
                            "$$item.discount_amount",
                            "$$item.quantity",
                          ],
                        },
                        "$$item.received_qty",
                      ],
                    },
                    4,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          "item":1,
          totalDiscount:1,
          totalTax:1,
          total:1,
          poId:1,
        },
      }
    ]);
    if(poReceivingDetails&& poReceivingDetails.length){
      let item= poReceivingDetails[0].item.filter(item=>{
        return item.received_qty>0

        // return item.is_edited>0
    })
    poReceivingDetails[0].item=item;
    poReceivingDetails[0].netValue=poReceivingDetails[0].total+ poReceivingDetails[0].totalDiscount-poReceivingDetails[0].totalTax;
  }
    return {
      success: true,
      data: poReceivingDetails
    }
  }catch(err){
    error(err);
    return {
      success: false,
      error: err
    }
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
}

// exporting the modules
module.exports = new purchaseController();
