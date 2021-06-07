// controllers
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
// const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
// const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
// const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
// const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');
const request = require("request-promise");

const BasicCtrl = require("../../../basic_config/basic_config.controller");
const BaseController = require("../../../baseController");
const Model = require("./models/purchase_order.model");
const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../../utils").logging;
const moment = require("moment");
const { forEach } = require("lodash");
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

  getPOList = async (req, res) => {
    try {
      var userId = mongoose.Types.ObjectId(req.user._id);
      var page = req.query.page || 1,
        sortingArray = {},
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 10;
        });
      let skip = parseInt(page - 1) * pageSize;
      sortingArray["receivingStatus"] = -1;
      sortingArray["delivery_date"] = -1;
      let todaysDate = moment().format("YYYY-MM-DD");
      let todaysEndDate = moment().format("YYYY-MM-DD");
      info("Get Purchase order  details !");
      let query = {
        plant: req.user.plant ? req.user.plant.toString() : "", //consider data type
        receivingStatus: { $ne: 1 }, //to-do// check if qury working properly
        end_of_validity_period: { $gte: todaysDate },
        start_of_validity_period: { $lte: todaysDate },
        status: 1,
        isDeleted: 0,
        // delivery_date:{$lte:todaysEndDate}//to-do
      };
      if (req.query.poNumber) {
        query.po_number = {
          $regex: req.query.poNumber,
          $options: "i",
        };
      }
      // get the total PO
      let totalPO = await Model.countDocuments(query);
      var poList = await Model.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: "purchaseorderreceivingdetails",
            let: {
              id: "$_id",
              poRecStatus: "$receivingStatus",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$poId", "$$id"] },
                      { $eq: ["$$poRecStatus", 4] },
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
                  pickerBoyId: 1,
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
          $project: {
            po_number: 1,
            vendor_no: 1,
            vendor_name: 1,
            itemCount: { $size: "$item" },
            poReceivingId: "$poDetails",
            receivingStatus: 1,
            fulfilmentStatus: 1,
            item: 1,
          },
        },
        {
          $match: {
            $or: [
              {
                "poReceivingId.pickerBoyId": userId,
              },
              { "poReceivingId.pickerBoyId": { $exists: false } },
            ],
          },
        },
        {
          $sort: sortingArray,
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
      ]).allowDiskUse(true);
      poList.forEach((order) => {
        let count = 0;
        order.item.forEach((item) => {
          if (!item.received_qty) {
            count++;
          } else if (item.received_qty && item.received_qty < item.quantity) {
            count++;
          }
        });
        order.itemCount = count;
        delete order.item;
      });
      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          result: poList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalPO,
          },
        },
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

  getPODetails = async (req, res) => {
    try {
      info("Get Purchase order  details !");
      var poDetails = await Model.aggregate([
        {
          $match: {
            status: 1,
            isDeleted: 0,
            _id: mongoose.Types.ObjectId(req.params.poId),
          },
        },
        {
          $project: {
            po_number: 1,
            vendor_no: 1,
            vendor_name: 1,
            "item._id": 1,
            "item.material_no": 1,
            "item.material_description": 1,
            "item.quantity": 1,
            "item.net_price": 1,
            "item.pending_qty": 1,
            "item.mrp": 1,
            pending_qty: 1,
            received_qty: 1,
            delivery_date: 1,
          },
        },
      ]).allowDiskUse(true);

      // success
      if (poDetails && poDetails[0] && poDetails[0].item) {
        for (let i = 0; i < poDetails[0].item.length; i++) {
          // adding recieved quantity in po order and gettinf fullfilment status
          poDetails[0].item[i].quantity = poDetails[0].item[i].pending_qty
            ? poDetails[0].item[i].pending_qty
            : poDetails[0].item[i].quantity;
        }
      }

      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        poDetails,
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


  getSTOPODetails = async (req, res) => {
    try {
      info("Get STO order  details !");
      var poDetails = await Model.aggregate([
        {
          $match: {
            status: 1,
            isDeleted: 0,
            _id: mongoose.Types.ObjectId(req.params.orderId),
          },
        },
        {
          $project: {
            po_number: 1,
            vendor_no: 1,
            vendor_name: 1,
            "item._id": 1,
            "item.item_no": 1,
            "item.material_no": 1,
            "item.material_description": 1,
            "item.quantity": 1,
            "item.net_price": 1,
            "item.suppliedQty": 1,
            "item.mrp": 1,
            "item.uom":1,
            "item.fulfillmentStatus":1,
            pending_qty: 1,
            received_qty: 1,
            delivery_date: 1,
          },
        },
      ]).allowDiskUse(true);

      // success
      if (poDetails.length > 0) {
        poDetails[0]['item'].forEach((item, j) => {
          console.log(item.quantity, parseInt(item.suppliedQty ? item.suppliedQty : 0), (parseInt(item.quantity) - parseInt(item.suppliedQty ? item.suppliedQty : 0)))
          poDetails[0]['item'][j]['quantity'] = (parseFloat(item.quantity) - parseFloat(item.suppliedQty ? item.suppliedQty : 0))

        })


        _.remove(poDetails[0]['item'], { 'fulfillmentStatus': 2 })

      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        poDetails,
        this.messageTypes.poListFetched
      );
      }
        else return this.errors(req, res, this.status.HTTP_CONFLICT, 'Unable to fetch stock transfer details');
      

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

  // startPickUP = async (req, res) => {
  //   try {
  //     info("Get Purchase order  details !", req.body, req.query, req.params);
  //     var poList = await Model.findOne({
  //       status: 1,
  //       isDeleted: 0,
  //     }).lean();
  //     // success
  //     return this.success(
  //       req,
  //       res,
  //       this.status.HTTP_OK,
  //       poList,
  //       this.messageTypes.userDetailsFetched
  //     );

  //     // catch any runtime error
  //   } catch (err) {
  //     error(err);
  //     this.errors(
  //       req,
  //       res,
  //       this.status.HTTP_INTERNAL_SERVER_ERROR,
  //       this.exceptions.internalServerErr(req, err)
  //     );
  //   }
  // };
  modifyPo = async (query, updateData) => {
    try {
      var poDetails = await Model.findOneAndUpdate(query, updateData, {
        newValue: true,
        useFindAndModify: false,
      });
      return {
        success: true,
        data: poDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  get = async (poId) => {
    try {
      var poDetails = await Model.aggregate([
        {
          $match: {
            isDeleted: 0, //to-do
            _id: mongoose.Types.ObjectId(poId),
          },
        },
        {
          $project: {
            po_number: 1,
            document_date: 1,
            vendor_no: 1,
            item: 1,
            delivery_date: 1,
            sapGrnNo: 1,
            delivery_date_array: 1,
            shiping_plant: 1,
            plant: 1
          },
        },
      ]).allowDiskUse(true);
      if (poDetails && _.isEmpty(poDetails)) {
        return {
          success: false

        };

      }
      return {
        success: true,
        data: poDetails,
      };
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };
  getVendorInfo = async (vendor_no) => {
    try {
      let body = {
        request: {
          from_date: "",
          to_date: "",
          purchase_org: "",
          vendor_no: vendor_no,
        },
      };
      let options = {
        method: "GET",
        uri: process.env.sapBaseUrl + process.env.vendorDetails,
        headers: {
          "Content-Type": "application/json",
        },
        json: true,
        body: body,
      };
      console.log(options);

      return await request(options);
    } catch (err) {
      console.log(err);
      throw err;
    }
  };
  getVendorDetails = async (req, res) => {
    try {
      info("Get Purchase order  details !");
      var vendorDetails = [];
      try {
        vendorDetails = await this.getVendorInfo(req.params.vendor_number);
        if (
          vendorDetails &&
          vendorDetails.response &&
          vendorDetails.response.length
        ) {
          vendorDetails = vendorDetails.response[0];
          let fullAddress = [];
          if (vendorDetails.street) {
            fullAddress.push(vendorDetails.street);
          }
          if (vendorDetails.street_3) {
            fullAddress.push(vendorDetails.street_3);
          }
          if (vendorDetails.district) {
            fullAddress.push(vendorDetails.district);
          }
          if (vendorDetails.city) {
            fullAddress.push(vendorDetails.city);
          }
          if (vendorDetails.address_time_zone) {
            fullAddress.push(vendorDetails.address_time_zone);
          }
          if (vendorDetails.city_postal_code) {
            fullAddress.push(",");
            fullAddress.push(vendorDetails.city_postal_code);
          }
          let details = {
            vendor_no: vendorDetails.vendor_no,
            name_of_organization: vendorDetails.name_1_of_organization,
            street: vendorDetails.street,
            city_postal_code: vendorDetails.city_postal_code,
            city: vendorDetails.city,
            country: vendorDetails.address_time_zone,
            mobileNumber: vendorDetails.mobile_no,
            email: vendorDetails.e_mail_address,
            currency: vendorDetails.purchase_order_currency,
            street_3: vendorDetails.street_3,
            district: vendorDetails.district,
            fullAddress: fullAddress.join(" "),
          };
          // success
          return this.success(
            req,
            res,
            this.status.HTTP_OK,
            details,
            this.messageTypes.poListFetched
          );
        } else {
          this.errors(
            req,
            res,
            this.status.HTTP_INTERNAL_SERVER_ERROR,
            this.messageTypes.vendorDetailsNotFound
          );
        }
      } catch (err) {
        console.log(err);
        this.errors(
          req,
          res,
          this.status.HTTP_INTERNAL_SERVER_ERROR,
          this.messageTypes.errorInGettingVendorDetails
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
  poFilteredList = async (req, res) => {
    try {
      info("Get Purchase order  filtered list !");
      let type = req.params.type;
      let pickerBoyId = mongoose.Types.ObjectId(req.user._id);
      var page = req.query.page || 1,
        sortingArray = {},
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 10;
        });
      let skip = parseInt(page - 1) * pageSize;
      let todaysDate = moment().format("YYYY-MM-DD");
      let todaysEndDate = moment().format("YYYY-MM-DD");
      var projectList = {
        po_number: 1,
        vendor_no: 1,
        vendor_name: 1,
        poReceivingId: "$poDetails",
        receivingStatus: 1,
        updatedAt: 1,
        delivery_date: 1,
      };
      let query = {
        status: 1,
        isDeleted: 0,
      };
      if (req.query.poNumber) {
        query.po_number = {
          $regex: req.query.poNumber,
          $options: "is",
        };
      }
      if (req.query.date) {
        query["delivery_date"] = moment.utc(new Date(req.query.date)).utcOffset("+05:30").format(
          "YYYY-MM-DD"
        );
      }
      if (type == "history") {
        query.receivingStatus = 1;
        query["sapGrnNo.pickerBoyId"] = pickerBoyId;
        projectList.itemCount = { $size: "$item" };
        sortingArray["updatedAt"] = -1;
        projectList.sapGrnNo = 1;
      } else if (type == "pending") {
        query.receivingStatus = 2;
        query["sapGrnNo.pickerBoyId"] = pickerBoyId;
        projectList.item = 1;
        projectList.sapGrnNo = 1;
      } else if (type == "ongoing") {
        query.receivingStatus = 4;
        projectList.item = 1;
        projectList.poReceivingId = "$poDetails";
      }
      sortingArray["delivery_date"] = -1;
      sortingArray["po_number"] = -1;
      // get the total PO
      if (type == "pending" || type == "history") {
        var totalPO = await Model.countDocuments({
          ...query,
        });
        var poList = await Model.aggregate([
          {
            $match: query,
          },
          {
            $project: projectList,
          },
          {
            $sort: sortingArray,
          },
          {
            $skip: skip,
          },
          {
            $limit: pageSize,
          },
        ]).allowDiskUse(true);
      } else {
        var totalPO = await Model.countDocuments({
          ...query,
        });
        var poList = await Model.aggregate([
          {
            $match: query,
          },
          {
            $lookup: {
              from: "purchaseorderreceivingdetails",
              let: {
                id: "$_id",
                poRecStatus: "$receivingStatus",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$poId", "$$id"] },
                        { $eq: ["$$poRecStatus", 4] },
                        { $eq: ["$isDeleted", 0] },
                        {
                          $eq: [
                            "$pickerBoyId",
                            mongoose.Types.ObjectId(req.user._id),
                          ],
                        },
                        // { $gt: ["$item.quantity", "$item.received_qty"] },//not working need to check later //to-do
                      ],
                    },
                  },
                },

                { $limit: 1 },
                {
                  $project: {
                    _id: 1,
                    pickerBoyId: 1,
                  },
                },
              ],
              as: "poDetails",
            },
          },
          {
            $unwind: {
              path: "$poDetails",
            },
          },
          {
            $project: projectList,
          },
          {
            $limit: pageSize,
          },
        ]).allowDiskUse(true);
      }
      // if(type=='pending'){
      //   if(poList && poList.length){
      //     poList.forEach((element)=>{
      //       let itemCount=0
      //       element.item.forEach((item)=>{
      //         if(item.received_qty>0){
      //           itemCount++;
      //         }
      //       })
      //       element.itemCount=itemCount;
      //       delete element.item;
      //     })
      //   }
      // }
      if (poList && poList.length) {
        poList.forEach((element) => {
          if (type == "ongoing" || type == "pending") {
            let itemCount = 0;
            element.item.forEach((item) => {
              if (!item.received_qty || item.received_qty != item.quantity) {
                itemCount++;
              }
            });
            element.itemCount = itemCount;
            delete element.item;
          }

          if (type == "pending" || type == "history") {
            element.deliveredDate =
              element.sapGrnNo[element.sapGrnNo.length - 1].date;
          }
          delete element.sapGrnNo;
        });
      }
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          result: poList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalPO,
          },
        },
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

  filteredPODetails = async (req, res) => {
    try {
      info("PO filtered list details");
      var type = req.query.type || "history";
      var poDetails = {};
      var projectList = {
        po_number: 1,
        vendor_no: 1,
        vendor_name: 1,
        receivingStatus: 1,
        updatedAt: 1,
        delivery_date: 1,
        sapGrnNo: 1,
      };
      if (type == "pending") {
        projectList.item = 1;
      }
      poDetails = await Model.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.poId),
          status: 1,
          isDeleted: 0,
        },
        projectList
      ).lean();

      if (poDetails) {
        // success
        if (poDetails && poDetails && poDetails.item && type == "pending") {
          let itemList = [];
          for (let i = 0; i < poDetails.item.length; i++) {
            // adding recieved quantity in po order and gettinf fullfilment status
            poDetails.item[i].quantity = poDetails.item[i].pending_qty
              ? poDetails.item[i].pending_qty
              : poDetails.item[i].quantity;
            if (poDetails.item[i].quantity > 0) {
              itemList.push(poDetails.item[i]);
            }
          }
          poDetails.item = itemList;
        }
        poDetails.deliveredDate =
          poDetails.sapGrnNo[poDetails.sapGrnNo.length - 1].date;

        return this.success(
          req,
          res,
          this.status.HTTP_OK,
          poDetails,
          this.messageTypes.poDetailsFetched
        );
      } else {
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.poDetailsNotFound
        );
      }
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

  insertPurchaseOrderData = async (sapRawData) => {
    try {
      if (sapRawData && sapRawData.length > 0) {
        var poNumberArrayFromSap = [];
        sapRawData = sapRawData.map((el) => {
          if (el) {
            poNumberArrayFromSap.push(el.po_number);
            if (el.po_number) {
              el.po_number = el.po_number.toString();
              el.isDeleted = 0;
              el.status = 1;
            }
          }
          return el;
        });

        const poDataFromDb = await Model.find(
          {
            po_number: {
              $in: poNumberArrayFromSap,
            },
          },
          {
            po_number: 1,
          }
        );

        if (poDataFromDb.length > 0) {
          const poNumberArrayFromdb = poDataFromDb.map((el) => {
            if (el) {
              return el.po_number;
            }
          });
          const finalPOArray = sapRawData.filter((val) => {
            return poNumberArrayFromdb.indexOf(val.po_number) == -1;
          });

          return await Model.insertMany(finalPOArray);
        } else {
          return await Model.insertMany(sapRawData);
        }
      }
    } catch (err) {
      error(err);
      return {
        success: false,
        error: err,
      };
    }
  };


  getStockTransferList = async (req, res) => {
    try {
      var userId = mongoose.Types.ObjectId(req.user._id);
      var page = req.query.page || 1,
        sortingArray = {},
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 10;
        });
      let skip = parseInt(page - 1) * pageSize;
      // sortingArray["pickingStatus"] = -1;
      sortingArray["_id"] = -1;
      let todaysDate = moment().format("YYYY-MM-DD");
      let todaysEndDate = moment().format("YYYY-MM-DD");
      info("Get Stock Transfer details !");
      let query = {
       //consider data type
        // end_of_validity_period: { $gte: todaysDate },
        // start_of_validity_period: { $lte: todaysDate },
       
        $and: [
         { shiping_plant: req.user.plant ? req.user.plant.toString() : ""},
          {
            $or: [{ po_document_type: 'ZWSI' }, { po_document_type: 'ZWST' }]
          }, {
            $or: [{ 'fulfillmentStatus': { $exists: true, $ne: 2 } }, {

              'fulfillmentStatus': { $exists: false }
            }]
          }


       
         ], 
        status: 1,
        isDeleted: 0,
        
        // delivery_date:{$lte:todaysEndDate}//to-do
      };
      if (req.query.poNumber) {
        query.po_number = {
          $regex: req.query.poNumber,
          $options: "i",
        };
      }
      // get the total PO
      let totalPO = await Model.countDocuments(query);
      var poList = await Model.aggregate([
        {
          $match: query,
        },


        {
          $project: {
            po_number: 1,
            vendor_no: 1,
            vendor_name: 1,
            itemCount: { $size: "$item" },
            poReceivingId: "$poDetails",
            receivingStatus: 1,
            fulfilmentStatus: 1,

          },
        },

        {
          $sort: sortingArray,
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
      ]).allowDiskUse(true);

     

      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          result: poList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalPO,
          },
        },
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


  getPendingStockTransferList = async (req, res) => {
    try {
      var userId = mongoose.Types.ObjectId(req.user._id);
      var page = req.query.page || 1,
        sortingArray = {},
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => {
          if (res.success) return res.data;
          else return 10;
        });
      let skip = parseInt(page - 1) * pageSize;
      sortingArray["pickingStatus"] = -1;
      sortingArray["delivery_date"] = -1;
      let todaysDate = moment().format("YYYY-MM-DD");
      let todaysEndDate = moment().format("YYYY-MM-DD");
      info("Get Stock Transfer details !");
      let query = {
        plant: req.user.plant ? req.user.plant.toString() : "", //consider data type
        // end_of_validity_period: { $gte: todaysDate },
        // start_of_validity_period: { $lte: todaysDate },
        $or: [{ po_document_type: 'ZWSI' }, { po_document_type: 'ZWST' }],
        status: 1,
        isDeleted: 0,
        pickingFullfilmentStatus:{ $exists: true,$eq:1}
        
        // delivery_date:{$lte:todaysEndDate}//to-do
      };
      if (req.query.poNumber) {
        query.po_number = {
          $regex: req.query.poNumber,
          $options: "i",
        };
      }
      // get the total PO
      let totalPO = await Model.countDocuments(query);
      var poList = await Model.aggregate([
        {
          $match: query,
        },


        {
          $project: {
            po_number: 1,
            vendor_no: 1,
            vendor_name: 1,
            itemCount: { $size: "$item" },
            poReceivingId: "$poDetails",
            receivingStatus: 1,
            fulfilmentStatus: 1,

          },
        },

        {
          $sort: sortingArray,
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
      ]).allowDiskUse(true);

      // success
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {
          result: poList,
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: totalPO,
          },
        },
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

  updateStoFullfilmentStatus = async (stoOrderId, stoItem, pickedItem, delivery_date) => {
    try {

      info(`Updating STO Info ! ${stoOrderId}`);
      console.log('pickedItem', pickedItem)
      let isUpdated;
      // suppliedQuantity 
      // console.log(JSON.stringify(invData))
      let tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
      let deliverDate = delivery_date || tomorrow;
      // moment(new Date()).format('YYYY-MM-DD')

      let stoFullfilmentStatus = 2;
      stoItem.forEach(async (sItem, i) => {
        pickedItem.forEach(async (item, i) => {
          let itemFullfilmentStatus = 1
          if (sItem.item_no == item.item_no && item.pickedQuantity <= (parseFloat(sItem.quantity) - parseFloat(sItem.suppliedQty ? sItem.suppliedQty : 0))) {
            if (item.pickedQuantity == (parseFloat(sItem.quantity) - parseFloat(sItem.suppliedQty ? sItem.suppliedQty : 0))) {
              itemFullfilmentStatus = 2
            } else {
              stoFullfilmentStatus = 1

            }
          


            stoItem[i].fulfillmentStatus = itemFullfilmentStatus;



            isUpdated = await Model.findOneAndUpdate({
              '_id': mongoose.Types.ObjectId(stoOrderId), 'item.item_no': item.item_no

            }, {
              $set: {

                'item.$.fulfillmentStatus': itemFullfilmentStatus,

              },
              $inc: {

                'item.$.suppliedQty': parseFloat(item.pickedQuantity ? item.pickedQuantity : 0),
              }
            });
           
          } else if ((sItem.fulfillmentStatus ? sItem.fulfillmentStatus : 0) <= 1) {
            stoFullfilmentStatus = 1

          }
        }
        )

      })
    
      let isUpdatedfulfillmentStatus = await Model.findOneAndUpdate({
        '_id': mongoose.Types.ObjectId(stoOrderId)
      }, {
        $set: {
          // 'req_del_date':deliverDate,
          'pickingFullfilmentStatus': stoFullfilmentStatus,

        }

      });
      console.log(isUpdated, isUpdatedfulfillmentStatus)
      if (isUpdatedfulfillmentStatus) {
        info('Sales order Status updated! !');
        return {
          success: true,
          data: {
            'isUpdatedfulfillmentStatus': isUpdatedfulfillmentStatus,
            'fulfillmentStatus': stoFullfilmentStatus
          }
        };
      } else {
        error('Failed to update STO STATUS! ');
        return {
          success: false,
        };
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


}

// exporting the modules
module.exports = new purchaseController();
