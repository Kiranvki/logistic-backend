// controllers
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

const BasicCtrl = require("../../basic_config/basic_config.controller");
const BaseController = require("../../baseController");
const Model = require("./models/purchase_order_recieving_details.model");
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

      let dataToInsert = {
        poId: poDetails._id,
        pickerBoyId: req.user._id,
        createdBy: req.user.email,
        recievingDate: new Date(),
        orderItems: poDetails.orderItems,
      };

      // inserting data into the db
      let isInserted = await Model.create(dataToInsert);
      let poUpdateDetails = await poCtrl.modifyPo(
        { _id: poDetails._id },
        { recievingStatus: 1 }
      );

      // check if inserted
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          isInserted,
          this.messageTypes.startedRecieving
        );
      } else {
        error("Error while adding in packing collection !");
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.startedNotRecieving
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

  poRecievingList = async (req, res) => {
    try {
      var poRecievingId = req.params.poRecievingId;
      info(
        "Get Purchase order  recieving details !",
        req.body,
        req.query,
        req.params
      );
      let query = {
        _id: mongoose.Types.ObjectId(poRecievingId),
        isDeleted: 0,
      };
      var poList = await Model.findOne(query).populate({
        path: "poId",
        select: { poNo: 1, supplierCode: 1, supplierName: 1, deliveryDate: 1 },
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

  recievePOItem = async (req, res) => {
    try {
      var itemId = req.params.itemId;
      var poRecievingId = req.body.poRecievingId;
      var recievedQty = req.body.recievedQty;

      info("Recieving PO item!", req.body, req.query, req.params);
      let query = {
        _id: mongoose.Types.ObjectId(poRecievingId),
        "orderItems._id": mongoose.Types.ObjectId(itemId),
      };
      let updateData = {
        "orderItems.$.recievedQty": recievedQty,
      };
      var updatedPO = await Model.findOneAndUpdate(query, updateData, {
        newValue: true,
        useFindAndModify: false,
      });
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        this.messageTypes.recievePOItem
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

  getPORecievingDetails = async (poId) => {
    try {
      info("Get PORecieving details !");

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
      var poRecievingId = req.params.poRecievingId;
      info(
        "Get Purchase order  recieving details !",
        req.body,
        req.query,
        req.params
      );
      let query = {
        _id: mongoose.Types.ObjectId(poRecievingId),
        isDeleted: 0,
        'orderItems.recievedQty':{$gt:0}
      };
      var bucketList = await Model.aggregate(
        [{$match:query},
          {
            $addFields: {
              total: {
                $sum: {
                  $map: {
                    input: "$orderItems",
                    as: "item",
                    in: {
                      $round: [
                        { $multiply: ["$$item.cost", "$$item.recievedQty"] },
                        4,
                      ],
                    },
                  },
                },
              },

              totalTax: {
                $sum: {
                  $map: {
                    input: "$orderItems",
                    as: "item",
                    in: {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ["$$item.itemTax", "$$item.quantity"] },
                            "$$item.recievedQty",
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
                    input: "$orderItems",
                    as: "item",
                    in: {
                      $round: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                "$$item.itemDiscount",
                                "$$item.quantity",
                              ],
                            },
                            "$$item.recievedQty",
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
              "orderItems._id": 1,
              "orderItems.itemId": 1,
              "orderItems.itemName": 1,
              "orderItems.quantity": 1,
              "orderItems.cost": 1,
              "orderItems.mrp": 1,
              "orderItems.recievedQty": 1,
              "orderItems.itemAmount": 1,
              totalDiscount:1,
              totalTax:1,
              total:1
            },
          }
        ]
      );

      if(bucketList && bucketList[0] && bucketList[0].orderItems && bucketList[0].orderItems.length){
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
        return this.errors(req, res, StatusCodes.HTTP_CONFLICT, this.messageTypes.emptyBucketList);
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
      var poRecievingId = req.params.poRecievingId;
      info(
        "Get Purchase order  recieving details !",
        req.body,
        req.query,
        req.params
      );
      var poRecievingId= req.params.poRecievingId;
      var vendorInvoiceNo = req.body.vendorInvoiceNo;
      let query = {
        _id: mongoose.Types.ObjectId(poRecievingId),
        isDeleted: 0,
      };
      var bucketList = await Model.aggregate(
        [{$match:query},
          {
            $addFields: {
              total: {
                $sum: {
                  $map: {
                    input: "$orderItems",
                    as: "item",
                    in: {
                      $round: [
                        { $multiply: ["$$item.cost", "$$item.recievedQty"] },
                        4,
                      ],
                    },
                  },
                },
              },

              totalTax: {
                $sum: {
                  $map: {
                    input: "$orderItems",
                    as: "item",
                    in: {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ["$$item.itemTax", "$$item.quantity"] },
                            "$$item.recievedQty",
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
                    input: "$orderItems",
                    as: "item",
                    in: {
                      $round: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                "$$item.itemDiscount",
                                "$$item.quantity",
                              ],
                            },
                            "$$item.recievedQty",
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
              "orderItems._id": 1,
              "orderItems.itemId": 1,
              "orderItems.itemName": 1,
              "orderItems.quantity": 1,
              "orderItems.cost": 1,
              "orderItems.mrp": 1,
              "orderItems.recievedQty": 1,
              "orderItems.itemAmount": 1,
              totalDiscount:1,
              totalTax:1,
              total:1
            },
          }
        ]
      );

      if(bucketList && bucketList[0] && bucketList[0].orderItems && bucketList[0].orderItems.length){
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
        return this.errors(req, res, StatusCodes.HTTP_CONFLICT, this.messageTypes.emptyBucketList);
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
  get =async (poRecievingId) =>{
    try{
      var poRecievingDetails= await  Model.aggregate([{
        $match:{
          status:1,
          isDeleted: 0,
          _id:mongoose.Types.ObjectId(poRecievingId) 
        }
      },{
        $project: {
          poId:1,
          'orderItems':1,
          'pickerBoyId':1,
          'recievingStatus':1,
          'netWeight':1
      }}
      ]);
      return {
        success: true,
        data: poRecievingDetails
      }
    }catch(err){
      error(err);
      return {
        success: false,
        error: err
      }
    }
  }

 getForGrnGeneration = async(poRecievingId)=>{
  try{
    let query = {
      _id: mongoose.Types.ObjectId(poRecievingId),
      isDeleted: 0,
      'orderItems.recievedQty':{$gt:0}
    };
    //calculate net value also when 
    var poRecievingDetails= await  Model.aggregate( [{$match:query},
      {
        $addFields: {
          total: {
            $sum: {
              $map: {
                input: "$orderItems",
                as: "item",
                in: {
                  $round: [
                    { $multiply: ["$$item.cost", "$$item.recievedQty"] },
                    4,
                  ],
                },
              },
            },
          },
  
          totalTax: {
            $sum: {
              $map: {
                input: "$orderItems",
                as: "item",
                in: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$$item.itemTax", "$$item.quantity"] },
                        "$$item.recievedQty",
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
                input: "$orderItems",
                as: "item",
                in: {
                  $round: [
                    {
                      $multiply: [
                        {
                          $divide: [
                            "$$item.itemDiscount",
                            "$$item.quantity",
                          ],
                        },
                        "$$item.recievedQty",
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
          "orderItems":1,
          totalDiscount:1,
          totalTax:1,
          total:1,
          poId:1,
        },
      }
    ]);
    poRecievingDetails[0].netValue=poRecievingDetails[0].total+ poRecievingDetails[0].totalDiscount-poRecievingDetails[0].totalTax;
    return {
      success: true,
      data: poRecievingDetails
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
