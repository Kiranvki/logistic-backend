
const BasicCtrl = require("../../../basic_config/basic_config.controller");
const BaseController = require("../../../baseController");
const Model = require("./models/stock_transfer_picking_details.model");
const poCtrl = require("../purchase_order/purchase_order.controller");

const mongoose = require("mongoose");
const _ = require("lodash");
const { error, info } = require("../../../../utils").logging;
const moment = require("moment");
const { deliveryDateUpdateFailedForSelesOrder } = require("../../../../responses/types/salesOrder");
const { date } = require("azure-storage");
// self apis

// padding the numbers
const pad = (n, width, z) => {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

// getting the model
class stockTransferPickingDetailController extends BaseController {
  // constructor
  constructor() {
    super();
    this.stockTransferOutmessageTypes = this.messageTypes.stockTransferOut;
    this.messageTypes = this.messageTypes.purchaseOrder;
  }


  // Internal Function get  sales order  details
  getOrderDetails = (orderId) => {
    try {
      info('Get Order  Details !');

      // get details 
      return Model.findOne({
        stoDbId: mongoose.Types.ObjectId(orderId),
        // isItemPicked:true,
        // isStartedPicking:true,
        isDeleted: 0,

      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching STO in STO PICKING DB!');
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
      return {
        success: false,
        error: err
      }
    }
  }


  getOrderItem = async (stockTransferPickingID, item_no) => {
    return Model.aggregate([
      { '$match': { '_id': mongoose.Types.ObjectId(stockTransferPickingID) } },
      {
        '$lookup': {
          'from': 'purchase_order',
          'let': { 'sto_id': '$stoDbId' },
          'pipeline': [
            // {'$unwind': { path: '$item'} },
            {
              '$match': {

                '$expr': {
                  '$and': [
                    { $eq: ['$_id', '$$sto_id'] },
                    // {$eq:[ '$item.item_no',item_no]}
                  ]
                }
              }
            }


          ],
          as: "orderDetail"
        }
      }
    ]).allowDiskUse(true).then((res) => {

      let plant = res[0]['orderDetail'][0]['plant'];
      // console.log(res[0])
      let item = res[0]['orderDetail'][0]['item'].filter(item => item['item_no'] == item_no);
      // console.log('item',_.isEmpty(item))
      if (item && !_.isEmpty(item)) {
        return {
          success: true,
          data: { 'orderDetail': item[0], 'plant': res[0]['orderDetail'][0]['plant'] }


        }
      } else {
        error('Error Searching item in STO picking Mapping DB!');
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



  }
  //get the list of picked Item with non zero qty
  getValidPickedItem = async (stockTransferPickingID) => {
    return Model.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(stockTransferPickingID) } },
      {
        $project: {
          item: 1,
          stoNumber: 1,
          plant: 1,
          shipping_plant: 1,
          stoDbId: 1

        }
      },
      { $unwind: '$item' },
      {
        '$match': {
          'item.pickedQuantity': { $gt: 0 }
        }
      },

      { $group: { '_id': '$_id', 'data': { $push: '$$ROOT' } } },
      {
        $project: {
          'items': "$data.item",
          '_id': '$_id',
          'stoDbId': { $arrayElemAt: ['$data.stoDbId', 0] },
          'plant': { $arrayElemAt: ['$data.plant', 0] },
          'stoNumber': { $arrayElemAt: ['$data.stoNumber', 0] },
          'shipping_plant': { $arrayElemAt: ['$data.shipping_plant', 0] }
        }
      }
    ])
      .allowDiskUse(true).then((res) => {

        // let plant = res[0]['orderDetail'][0]['plant'];
        // console.log(res[0])

        // console.log('item',_.isEmpty(item))
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: {
              'item': res[0]['items'], 'id': res[0]['_id'], plant: res[0]['plant'],
              'shipping_plant': res[0]['shipping_plant'],
              'stoNumber': res[0]['stoNumber'],
              'stoDbId': res[0]['stoDbId']
            }


          }
        } else {
          error('Error Searching item in STO picking Mapping DB!');
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



  }

  startPicking = async (req, res, next) => {
    try {
      info(`Start stock picking allocation!`);
      let user = req.user,
        pickerBoyId = user._id,
        pickerBoyPlant = user.plant,
        date = new Date(),
        stoNumber = req.body.stoDetails.po_number,
        stoDbId = req.body.stoDetails._id,
        shipping_plant = req.body.stoDetails.shiping_plant,
        plant = req.body.stoDetails.plant


      let dataObj = {
        'pickerBoyId': pickerBoyId,
        'stoNumber': stoNumber,
        'stoDbId': stoDbId,
        'pickingDate': date,
        'plant': plant,
        'shipping_plant': shipping_plant,
        'isStartedPicking': true

      }
      let isInserted = await Model.startPickingOrder(dataObj)
      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.salesOrderAddedInPackingStage);
      } else {
        error('Error while adding in packing collection !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderNotAddedInPackingStage);
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }


  }

  addItem = async (req, res, next) => {
    try {
      info(`Add Stock Transfer Item to CART!`);
      console.log(req.body.item_no, req.body.qty, req.body.stoDetails.orderDetail)
      // picked item detail
      let stoPickingId = req.params.stoPickingId,
        pickerBoyId = req.user._id;
      let itemDetail = {
        isItemPicked: true,
        item_no: req.body.stoDetails.orderDetail.item_no,
        plant: req.body.stoDetails.orderDetail.plant,
        material_group: req.body.stoDetails.orderDetail.material_no,
        material_description: req.body.stoDetails.orderDetail.material_description,
        storage_location: req.body.stoDetails.orderDetail.storage_location,
        tax_code: req.body.stoDetails.orderDetail.tax_code,
        conversion_factor_status: req.body.stoDetails.orderDetail.conversion_factor_status,
        material_no: req.body.stoDetails.orderDetail.material_no,
        quantity: req.body.stoDetails.orderDetail.quantity,
        net_price: req.body.stoDetails.orderDetail.net_price,
        selling_price: req.body.stoDetails.orderDetail.selling_price,
        mrp_amount: req.body.stoDetails.orderDetail.mrp_amount,
        uom: req.body.stoDetails.orderDetail.uom,
        taxable_value: req.body.stoDetails.orderDetail.taxable_value,
        discount_amount: req.body.stoDetails.orderDetail.discount_amount,
        discount_perc: req.body.stoDetails.orderDetail.discount_perc,
        pending_qty: req.body.stoDetails.orderDetail.quantity - (req.body.qty + req.body.stoDetails.orderDetail.suppliedQty ? req.body.stoDetails.orderDetail.suppliedQty : 0),
        pickedQuantity: req.body.qty,
        remarks: req.body.remarks,
        date_of_manufacturing: req.body.stoDetails.orderDetail.delivery_date
      }

      let isInserted = await Model.addItem(stoPickingId, itemDetail)
      // check if inserted 

      if (isInserted && !_.isEmpty(isInserted)) {

        // await pickerBoySalesOrderModel.updateIsItemPickedStatus(pickerBoySalesOrderMappingId, true)


        // fetch order detail picekd by picker boy
        let orderDetail = await Model.getOrderDetailPickedByPickerBoyId(pickerBoyId)
        orderDetail = orderDetail[0]


        // let orderDetail = await Model.getPickedItemStatus(stoPickingId)
        // orderDetail = orderDetail[0]

        // changes required quadratic
        if (orderDetail && orderDetail['orderItem'].length > 0 && orderDetail['item'].length >= 0) {
          orderDetail['orderItem'].forEach((x, i) => {

            orderDetail['orderItem'][i].is_item_picked = false;
            orderDetail['item'].forEach((y, j) => {

              if (x.item_no == y.item_no) {

                orderDetail['orderItem'][i] = y;

              }
            })
          })
          orderDetail['item'] = undefined
        }


        return this.success(req, res, this.status.HTTP_OK, orderDetail, this.messageTypes.salesOrderAddedInPackingStage);
      } else {
        error('Error while adding in packing collection !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderNotAddedInPackingStage);
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }


  }


  getPickedItemStatus = async (req, res) => {
    try {
      // fetch order detail picekd by picker boy
      let stoPickingId = req.params.stoPickingId
      let orderDetail = await Model.getPickedItemStatus(stoPickingId)
      orderDetail = orderDetail[0]

      // changes required quadratic
      if (orderDetail['orderItem'].length > 0 && orderDetail['item'].length >= 0) {
        orderDetail['orderItem'].forEach((x, i) => {

          orderDetail['orderItem'][i].is_item_picked = false;
          orderDetail['item'].forEach((y, j) => {

            if (x.item_no == y.item_no) {

              orderDetail['orderItem'][i] = y;

            }
          })
        })


        orderDetail['item'] = undefined

        orderDetail['orderItem'].forEach((item, j) => {
          console.log(item.quantity, parseInt(item.suppliedQty ? item.suppliedQty : 0), (parseInt(item.quantity) - parseInt(item.suppliedQty ? item.suppliedQty : 0)))
          if (item.is_item_picked) {
            orderDetail['orderItem'][j]['quantity'] = (parseFloat(item.pending_qty))
          } else {
            orderDetail['orderItem'][j]['quantity'] = (parseFloat(item.quantity) - parseFloat(item.suppliedQty ? item.suppliedQty : 0))
          }
        })


        _.remove(orderDetail['orderItem'], { 'pickingFullfilmentStatus': 2 })

        console.log(orderDetail)

        return this.success(req, res, this.status.HTTP_OK, orderDetail, this.messageTypes.salesOrderAddedInPackingStage);
      } else {
        error('Error while adding in packing collection !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderNotAddedInPackingStage);
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }


  }



  getDeliveryNumberByPickerOrderId = async (stoPickingId) => {
    info('Fetching Delivery Number!')
    return await Model.findOne(
      {
        $and: [
          { '_id': mongoose.Types.ObjectId(stoPickingId) },
          { 'delivery_no': { $ne: 'N/A' } },
          { 'invoiceDetail.isInvoice': false }
        ]
      }, { 'delivery_no': 1, 'fullfilment': 1, 'vendor_name': 1, 'shipping_plant': 1, 'plant': 1, 'delivery_date': 1, 'stoDbId': 1, 'stoNumber': 1 }).lean().then((res) => {

        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in Stock transfer picking detail DB!');
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

  }

  getBucketDetail = async (req, res, next) => {
    try {
      info(`Fetching Cart/Bucket Item Detail!`);
      let stoPickingId = req.params.stoPickingId,
        pickerBoyId = req.user._id;
      let searchObj = [{
        '_id': mongoose.Types.ObjectId(stoPickingId),
        'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId)
      }, {
        invoiceDetail: 0, retryCount: 0, delivery_no: 0, pickingStatus: 0,
        "pickingStatus": 0,
        "fullfilment": 0,
        "status": 0,
        "isDeleted": 0,
        "remarks": 0,
        "isSapError": 0,
        "pickingAllocationRequestPayload": 0,
        "pickingAllocationResponsePayload": 0,
        "invoiceRequestPayload": 0,
        "invoiceResponsePayload": 0,
        "pickerBoyId": 0,
        "plant": 0,
        "item.material_group": 0,

        "item.tax_code": 0,
        "item.conversion_factor_status": 0,


        "item.net_price": 0,
        "item.selling_price": 0,
        "item.mrp_amount": 0,
        "item.taxable_value": 0,
        "item.discount_amount": 0,
        "item.discount_perc": 0,
        "item.storage_location": 0,
        "item._id": 0,
        "item.plant": 0,
        "item.date_of_manufacturing": 0,
        "createdAt": 0,
        "updatedAt": 0,
        "__v": 0
      }]
      let bucketDetail = await Model.getOrderById(searchObj);
      if (bucketDetail && !_.isEmpty(bucketDetail)) {
        return this.success(req, res, this.status.HTTP_OK, bucketDetail, this.messageTypes.salesOrderAddedInPackingStage);
      } else {
        error('Error while adding in packing collection !');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.salesOrderNotAddedInPackingStage);
      }
      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }


  }


  // Internal Function get picking Status / Delivery Number order mapping details
  getPickingDetails = (pickerBoyStoMappingId) => {
    try {
      info('Get STO Picking Details !');

      // get details 
      return Model.findOne({
        _id: mongoose.Types.ObjectId(pickerBoyStoMappingId),

        delivery_no: { $ne: 'N/A' },
        isDeleted: 0
      }, '_id delivery_no flag remarks deliveryRetryCount').lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in PickerBoy Order Mapping DB!');
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
      return {
        success: false,
        error: err
      }
    }
  }


  gerPendingInvoices = async (req, res, next) => {

    try {


      info('Fetching Pending Invoices !');
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

        $and: [
          { pickerBoyId: mongoose.Types.ObjectId(userId) },
          {
            delivery_no: { $ne: 'N/A' }
          },
          {
            'invoiceDetail.isInvoice': false
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
            stoNumber: 1,
            delivery_no: 1,
            'fullfilmentStatus': '$ROOT.pickingFullfilmentStatus',

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


      if (poList && !_.isEmpty(poList)) {
        console.log('success')



        return this.success(req, res, this.status.HTTP_OK,

          poList,
          this.messageTypes.PickingAllocationGeneratedSuccesfully);
      }



      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.PickingUpdateFailed);


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }
  // Internal Function get invoice detail order mapping details
  getInvoiceDetails = (pickerBoyStoMappingId) => {
    try {
      info('Get STO Invoice Details !');

      // get details 
      return Model.findOne({
        _id: mongoose.Types.ObjectId(pickerBoyStoMappingId),
        'invoiceDetail.isInvoice': true,
        delivery_no: { $ne: 'N/A' },
        isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in PickerBoy Order Mapping DB!');
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
      return {
        success: false,
        error: err
      }
    }
  }


  // Internal Function get customer details 
  getAddedItemDetails = (stoMappingId, itemId) => {
    try {
      info('Get Added Item details !');
      // console.log(pickerBoySalesOrderMappingId,itemId)
      // get details 
      return Model.findOne({
        _id: mongoose.Types.ObjectId(stoMappingId),
        'item.item_no': itemId,
        isDeleted: 0
      }).lean().then((res) => {
        // console.log(res)
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching item in STO PICKING DETAILs DB!');
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




  generateStoDelivery = async (req, res, next) => {

    let pickedItem = req.body.pickedStoDetails.item,
      stoId = req.body.pickedStoDetails.stoDbId,
      orderDetail = req.body.stoDetails
    // console.log('test',pickedItem,stoId)
    // req.body.delivery_detail
    console.log(orderDetail)


    try {
      let OrderData = req.body.orderDetail;
      //   pickedItem = OrderData['itemDetail'];
      console.log('OrderData', OrderData)
      // req.body.delivery_detail['data']['deliveryRetryCount'] = 0;

      // invoiceDetail = req.body.invoice_detail['data'][0]
      // let pickerBoyOrderMappingId = req.params.pickerBoyOrderMappingId, // type 
      let deliveryDetail = req.body.delivery_detail['data'] || undefined,
        stoPickingId = req.params.stoPickingId;


      //update delivery date  suppliedQty
      // console.log('delivery', OrderData['itemDetail'])
      let soUpdateFullfilemt = await poCtrl.updateStoFullfilmentStatus(stoId, orderDetail['item'], pickedItem, req.body.deliveryDate)

      let pickingDetail = await this.getPickingDetails(stoPickingId)

      info('Picking Allocation is created !');
      if (pickingDetail.success) {
        console.log('success')



        return this.success(req, res, this.status.HTTP_OK,

          pickingDetail.data,
          this.messageTypes.PickingAllocationGeneratedSuccesfully);
      }



      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.PickingUpdateFailed);


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }

  getHistory = async (req, res, next) => {
    try {
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.searchKey || '',
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||
        searchDate = req.query.searchDate || '',
        type = req.params.type,
        plant = req.user.plant,
        sortingArray = {};
      sortingArray[sortBy] = -1;
      let pickerBoyId = req.user._id,
        historyData;
      let queryObj = [{
        $match: {
          pickerBoyId: mongoose.Types.ObjectId(pickerBoyId),
          $or: [{
            'invoiceDetail.isInvoice': true
          }, { 'invoiceDetail.isInvoiceRequest': true }]
        }

      }, {
        $project: {
          '_id': 1,
          'plant': 1,
          'delivery_no': 1,
          'state': 1,
          'invoiceDetail.invoice.invoice_no': 1,
          'pickingDate': 1,
          'stoNumber': 1,
          'fullfilmentStatus': '$ROOT.pickingFullfilmentStatus',
          'delivery_date': 1,

          'shipping_plant': 1,
          'stoDbId': 1,
          'pickingStatus': 1,

          'numberOfItems': { $cond: { if: { $isArray: "$item" }, then: { $size: "$item" }, else: "NA" } }
        }
      }, {
        $sort: {
          '_id': -1
        }
      }, {
        $skip: (pageSize * (page - 1))
      }, {
        $limit: pageSize
      }]


      // creating a match object
      if (searchKey !== '')
        pipeline = [{
          $match: {
            pickerBoyId: mongoose.Types.ObjectId(pickerBoyId),
            $or: [{
              'invoiceDetail.isInvoice': true
            }, { 'invoiceDetail.isInvoiceRequest': true }]
          }

        },
        {
          $or: [{
            'delivery_no': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'stoNumber': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'sold_to_party_description': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'customer_type': {
              $regex: searchKey,
              $options: 'is'
            }
          }]


        },
        {
          $project: {

            'plant': 1,
            'delivery_no': 1,
            'state': 1,
            'invoiceDetail.invoice.invoiceId': 1,
            'pickingDate': 1,
            'stoNumber': 1,
            'fullfilmentStatus': '$ROOT.pickingFullfilmentStatus',
            'delivery_date': 1,

            'shipping_plant': 1,
            'stoDbId': 1,
            'pickingStatus': 1,

            'numberOfItems': { $cond: { if: { $isArray: "$item" }, then: { $size: "$item" }, else: "NA" } }
          }
        }
          ,
        {
          $sort: {
            '_id': -1
          }
        },
        {
          $skip: (pageSize * (page - 1))
        }, {
          $limit: pageSize
        }
        ];


      historyData = await Model.aggregate(queryObj);



      info('History detail fetch succesfully !');
      if (historyData.length) {
        return this.success(req, res, this.status.HTTP_OK,
          // req.body.invoice_detail
          {
            results: historyData,
            pageMeta: {
              skip: parseInt(skip),
              pageSize: pageSize,
              total: historyData.length  //item
            }
          }
          ,
          this.stockTransferOutmessageTypes.historyDetailFetchedSuccessfully);
      }



      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.stockTransferOutmessageTypes.historyDetailFetchedFailed);


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }


  }


  // getOrderHistoryByPickerBoyID
  getOrderHistoryAndInvoices = async (req, res, next) => {
    try {
      info('Get History  Order details !');

      // let { sortBy, page, pageSize, locationId, cityId, searchKey, startOfTheDay, endOfTheDay } = req.query
      // let sortingArray = {};
      // sortingArray[sortBy] = -1;
      // let skip = parseInt(page - 1) * pageSize;
      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = '',//req.query.search || '',
        sortBy = req.query.sortBy || 'req_del_date',
        orderid = req.params.stoPickingId,
        sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // item count missing
      let searchObject = {

        '_id': mongoose.Types.ObjectId(orderid),
        'invoiceDetail.isInvoice': true

      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'customerName': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'customerCode': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };
      // console.log(...searchObject)
      let totalCount = await Model.aggregate([{
        $match:
          searchObject

      },
      {
        $count: 'sum'
      }
      ]).allowDiskUse(true);

      // calculating the total number of applications for the given scenario
      if (totalCount[0] !== undefined)
        totalCount = totalCount[0].sum;
      else
        totalCount = 0;

      // get list  
      let stockTransferDetail = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      },
      {
        $lookup: {
          from: 'invoicemasters',
          localField: 'invoiceDetail.invoice.invoiceDbId',
          foreignField: '_id',
          as: 'invoice'

        }
      },
      {
        $lookup: {
          from: 'purchase_order',
          localField: 'stoDbId',
          foreignField: '_id',
          as: 'stockTransferDetails'

        }
      },
      { $unwind: '$invoice' },
      { $unwind: '$stoDbId' },
      {
        $group: {
          _id: '$stoNumber', invoice: {
            $push: {
              'invoice_no': '$invoiceDetail.invoice.invoice_no',
              'suppliedQty': { '$sum': '$invoice.itemSupplied.suppliedQty' }, 'item_no': '$invoice.itemSupplied.item_no',
              'invoicedbid': '$invoiceDetail.invoice.invoiceDbId', 'date': '$invoice.createdAt'
            }
          },
          'customerName': { '$first': '$invoice.customerName' },
          'deliveryDate': { $first: '$delivery_date' },
          'pickingStatus': { $first: '$pickingStatus' },
          'pickerboyOrderMappingId': { $first: '$_id' },
          'invoice_no': { $first: '$invoice_no' },
          'invoicedbid': { $first: '$invoicedbid' },
          'fullfilmentStatus': { $first: { $first: '$stockTransferDetails.pickingFullfilmentStatus' } },
          'sold_to_party': { $first: '$invoice.invoiceDetails.sold_to_party' }
        }
      }


        , {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
      },
      {
        $project: {
          'onlineReferenceNo': 1,
          'customerCode': 1,
          'customerName': 1,
          'customerType': 1,
          'shippingId': 1,
          'cityId': 1,
          'plant': 1,
          'stoDbId': 1,
          'state': 1,
          'invoiceDetail.invoice.invoiceId': 1,
          'deliveryDate': 1,
          'pickingStatus': 1,
          'stoDbId': 1,
          'fullfilmentStatus': 1,
          'delivery_date': 1,
          'pickingDate': 1,
          'shipping_point': 1,
          'invoice': 1,
          'sold_to_party': 1,
          'pickerboyOrderMappingId': 1,

          // 'numberOfItems': { $cond: { if: { $isArray: "$invoice.itemSupplied" }, then: { $size: "$invoice.itemSupplied" }, else: "NA" } }
        }
      }

      ]).allowDiskUse(true)
      // console.log(salesOrderList)
      // return {
      //   success: true,
      //   data: salesOrderList,
      //   total: totalCount
      // };
      if (stockTransferDetail.length > 0) {
        return this.success(req, res, this.status.HTTP_OK, {
          results: stockTransferDetail[0],
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: stockTransferDetail.length  //item
          }
        }, this.messageTypes.historyFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedHistoryDetails);


      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
      }
    }
  }


  getOnGoing = async (req, res, next) => {
    try {
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.searchKey || '',
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||
        searchDate = req.query.searchDate || '',
        type = req.params.type,
        plant = req.user.plant,
        sortingArray = {};
      sortingArray[sortBy] = -1;
      let pickerBoyId = req.user._id,
        ongoingData;
      let queryObj = [{
        $match: {
          pickerBoyId: mongoose.Types.ObjectId(pickerBoyId),
          isItemPicked: true,
          isStartedPicking: true

        }

      }, {
        $project: {

          'plant': 1,



          'pickingDate': 1,
          'stoNumber': 1,

          'delivery_date': 1,

          'shipping_plant': 1,
          'stoDbId': 1,
          'pickingStatus': 1,

          'numberOfItems': { $cond: { if: { $isArray: "$item" }, then: { $size: "$item" }, else: "NA" } }
        }
      }, {
        $sort: {
          '_id': -1
        }
      }, {
        $skip: (pageSize * (page - 1))
      }, {
        $limit: pageSize
      }]


      // creating a match object
      if (searchKey !== '')
        pipeline = [{
          $match: {
            pickerBoyId: mongoose.Types.ObjectId(pickerBoyId),
            isItemPicked: true,
            isStartedPicking: true
          }

        },
        {
          $or: [{
            'delivery_no': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'stoNumber': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'sold_to_party_description': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'customer_type': {
              $regex: searchKey,
              $options: 'is'
            }
          }]


        },
        {
          $project: {

            'plant': 1,



            'pickingDate': 1,
            'stoNumber': 1,

            'delivery_date': 1,

            'shipping_plant': 1,
            'stoDbId': 1,
            'pickingStatus': 1,

            'numberOfItems': { $cond: { if: { $isArray: "$item" }, then: { $size: "$item" }, else: "NA" } }
          }
        }
          ,
        {
          $sort: {
            '_id': -1
          }
        },
        {
          $skip: (pageSize * (page - 1))
        }, {
          $limit: pageSize
        }
        ];


      ongoingData = await Model.aggregate(queryObj);



      info('ON GOING detail fetch succesfully !');
      if (ongoingData.length) {
        return this.success(req, res, this.status.HTTP_OK,
          // req.body.invoice_detail
          {
            results: ongoingData,
            pageMeta: {
              skip: parseInt(skip),
              pageSize: pageSize,
              total: ongoingData.length  //item
            }
          }
          ,
          this.stockTransferOutmessageTypes.ongoingDetailFetchedSuccessfully);
      }


      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.stockTransferOutmessageTypes.ongoingDetailFetchedFailed);


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }


  }

  getPendingInvoices = async (req, res, next) => {
    try {
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.searchKey || '',
        stoDbId = req.params.stoDbId,
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||
        searchDate = req.query.searchDate || '',
        type = req.params.type,
        plant = req.user.plant,
        sortingArray = {};
      sortingArray[sortBy] = -1;
      let pickerBoyId = req.user._id,
        pendingInvoicesData;
      let queryObj = [{
        $match: {
          pickerBoyId: mongoose.Types.ObjectId(pickerBoyId),
          'invoiceDetail.isInvoice': false,
          'delivery_no': {
            $ne: 'N/A'
          },


        }

      }, {
        $project: {

          'plant': 1,



          'pickingDate': 1,
          'stoNumber': 1,

          'delivery_date': 1,
          'delivery_no': 1,
          'shipping_plant': 1,
          'stoDbId': 1,
          'pickingStatus': 1,

          'numberOfItems': { $cond: { if: { $isArray: "$item" }, then: { $size: "$item" }, else: "NA" } }
        }
      }, {
        $sort: {
          '_id': -1
        }
      }, {
        $skip: (pageSize * (page - 1))
      }, {
        $limit: pageSize
      }]


      // creating a match object
      if (searchKey !== '')
        pipeline = [{
          $match: {
            pickerBoyId: mongoose.Types.ObjectId(pickerBoyId),
            isItemPicked: true,
            isStartedPicking: true
          }

        },
        {
          $or: [{
            'delivery_no': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'stoNumber': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'sold_to_party_description': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'customer_type': {
              $regex: searchKey,
              $options: 'is'
            }
          }]


        },
        {
          $project: {

            'plant': 1,



            'pickingDate': 1,
            'stoNumber': 1,

            'delivery_date': 1,

            'shipping_plant': 1,
            'stoDbId': 1,
            'pickingStatus': 1,

            'numberOfItems': { $cond: { if: { $isArray: "$item" }, then: { $size: "$item" }, else: "NA" } }
          }
        }
          ,
        {
          $sort: {
            '_id': -1
          }
        },
        {
          $skip: (pageSize * (page - 1))
        }, {
          $limit: pageSize
        }
        ];


      pendingInvoicesData = await Model.aggregate(queryObj);



      info('ON GOING detail fetch succesfully !');
      if (pendingInvoicesData.length) {
        return this.success(req, res, this.status.HTTP_OK,
          // req.body.invoice_detail
          {
            results: pendingInvoicesData,
            pageMeta: {
              skip: parseInt(skip),
              pageSize: pageSize,
              total: pendingInvoicesData.length  //item
            }
          }
          ,
          this.stockTransferOutmessageTypes.pendingInvoicesFetchedSuccessfully);
      }


      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.stockTransferOutmessageTypes.pendingInvoiceFetchedFailed);


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }


  }

  getPickingStatus = async (pickerBoyId) => {
    return await Model.findOne(
      {
        $and: [
          { 'pickerBoyId': mongoose.Types.ObjectId(pickerBoyId) },
          { 'isStartedPicking': true }, { 'isItemPicked': true },
          { 'invoiceDetail.isInvoice': false }
        ]
      }).lean().then((res) => {

        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in STO DB!');
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

  }


  generateStoInvoice = async (req, res, next) => {


    try {
      let invData = req.body.invDetail
      // invoiceDetail = req.body.invoice_detail['data'][0]


      // sales_orderController.UpdateSalesOrderFullfilmentStatusAndSuppliedQuantity(OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['_id'], OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['item'], req.body.invoice_detail)
      //  salesOrderId: {
      //   _id: 606901f99429dd62745df225,

      // itemDetail{
      //   totalQuantity: 1,
      // requireQuantity: 1,
      // suppliedQty: 0,
      // }
      //   req.body.invDetail['itemSupplied'].forEach((data,i)=>{
      //   OrderData['itemDetail'].forEach((item,j) => {
      //     // console.log('item_no',data.item_no,item.item_no)
      //     if(data.item_no==item.item_no){

      //       req.body.invDetail['itemSupplied'][i]['material_description'] = item['itemName']
      //     }



      //   })

      // })
      // console.log(req.body.invDetail['itemSupplied'])

      info('Invoice Generated and updated to DB !');
      if (invData) {
        return this.success(req, res, this.status.HTTP_OK,
          // req.body.invoice_detail
          invData,
          this.messageTypes.InvoiceGeneratedSuccesfully);
      }



      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.InvoiceUpdateFailed);


    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }


  // getOrderHistoryByPickerBoyID
  getPendingOrderAndInvoices = async (req, res, next) => {
    try {
      info('Get History  Order details !');

      // let { sortBy, page, pageSize, locationId, cityId, searchKey, startOfTheDay, endOfTheDay } = req.query
      // let sortingArray = {};
      // sortingArray[sortBy] = -1;
      // let skip = parseInt(page - 1) * pageSize;
      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = '',//req.query.search || '',
        sortBy = req.query.sortBy || 'req_del_date',
        orderid = req.params.orderid,
        sortingArray = {};
      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // item count missing
      let searchObject = {
        // 'pickerBoyId': mongoose.Types.ObjectId(req.user._id), //req.user._id,
        'stoDbId': mongoose.Types.ObjectId(orderid),
        'invoiceDetail.isInvoice': true
        // 'isPacked': 0,
        // 'fulfillmentStatus': 0,
        // 'locationId': parseInt(locationId),
        // 'cityId': cityId,

        // 'req_del_date': {

        //   '$lte': startOfTheDay
        // }
      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'customerName': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'customerCode': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };
      // console.log(...searchObject)
      let totalCount = await Model.aggregate([{
        $match:
          searchObject

      },
      {
        $count: 'sum'
      }
      ]).allowDiskUse(true);

      // calculating the total number of applications for the given scenario
      if (totalCount[0] !== undefined)
        totalCount = totalCount[0].sum;
      else
        totalCount = 0;

      // get list  
      let orderDetail = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      },
      {
        $lookup: {
          from: 'invoicemasters',
          localField: 'invoiceDetail.invoice.invoiceDbId',
          foreignField: '_id',
          as: 'invoice'

        }
      },
      {
        $lookup: {
          from: 'purchase_order',
          localField: 'stoDbId',
          foreignField: '_id',
          as: 'stockTransferDetails'

        }
      },
      { $unwind: '$invoice' },
      { $unwind: '$stoDbId' },
      {
        $group: {
          _id: '$stoNumber', invoice: {
            $push: {
              'invoice_no': '$invoiceDetail.invoice.invoice_no',
              'suppliedQty': { '$sum': '$invoice.itemSupplied.suppliedQty' }, 'item_no': '$invoice.itemSupplied.item_no',
              'invoicedbid': '$invoiceDetail.invoice.invoiceDbId', 'date': '$invoice.createdAt'
            }
          },
          'customerName': { '$first': '$invoice.customerName' },
          'deliveryDate': { $first: '$delivery_date' },
          'item': { $first: { $first: '$stockTransferDetails.item' } },
          'stockTransferId': { $first: { $first: '$stockTransferDetails._id' } },
          'sold_to_party': { $first: '$invoice.invoiceDetails.sold_to_party' }
        }
      }



        , {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
      },
      {
        $project: {
          'onlineReferenceNo': 1,
          'customerCode': 1,
          'customerName': 1,
          'customerType': 1,
          'shippingId': 1,
          'cityId': 1,
          'plant': 1,

          'stoDbId': 1,
          'state': 1,
          'invoiceDetail.invoice.invoiceId': 1,
          'deliveryDate': 1,
          'stoDbId': 1,
          'pickingFullfilmentStatus': 1,
          'delivery_date': 1,
          'pickingDate': 1,
          'shipping_point': 1,
          'invoice': 1,
          'sold_to_party': 1,
          'stockTransferId': 1,
          'item': 1
          // 'numberOfItems': { $cond: { if: { $isArray: "$invoice.itemSupplied" }, then: { $size: "$invoice.itemSupplied" }, else: "NA" } }
        }
      }

      ]).allowDiskUse(true)
      // console.log(salesOrderList)
      // return {
      //   success: true,
      //   data: salesOrderList,
      //   total: totalCount
      // };

      if (orderDetail.length > 0) {
        orderDetail[0]['item'].forEach((item, j) => {
          console.log(item.quantity, parseInt(item.suppliedQty ? item.suppliedQty : 0), (parseInt(item.quantity) - parseInt(item.suppliedQty ? item.suppliedQty : 0)))
          orderDetail[0]['item'][j]['quantity'] = (parseFloat(item.quantity) - parseFloat(item.suppliedQty ? item.suppliedQty : 0))

        })


        _.remove(orderDetail[0]['item'], { 'pickingFullfilmentStatus': 2 })


        return this.success(req, res, this.status.HTTP_OK, {
          results: orderDetail[0],
          pageMeta: {
            skip: parseInt(skip),
            pageSize: pageSize,
            total: orderDetail.length  //item
          }
        }, this.messageTypes.historyFetchedSuccessfully);
      }
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.unableToFetchedHistoryDetails);


      // catch any runtime error 
    } catch (err) {
      error(err);
      return {
        success: false,
      }
    }
  }






}



// exporting the modules 
module.exports = new stockTransferPickingDetailController();