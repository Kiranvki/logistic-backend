// controllers 
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');
const invoiceMastermodel = require('./models/invoice_master.model');
const QRCode = require('qrcode');//QR code
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/invoice_master.model');
const mongoose = require('mongoose');
const _ = require('lodash');
var { Parser } = require('json2csv')
const {
  error,
  info
} = require('../../../utils').logging;
const moment = require('moment');
// self apis
const {
  hitTallyCustomerAccountsSync,
  hitCustomerPaymentInvoiceSync,
} = require('../../../third_party_api/self');
// padding the numbers
const pad = (n, width, z) => {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};
// We are using timeout because the Flow is synchronised and inorder to get the final report we need to wait for 5 secs 
class timeout {
  sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}

// getting the model 
class invoiceMasterController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.invoice;
  }
  getDetails = async (invId) => {
    try {
      info('Get Invoice details !');

      // get details 
      return await Model.findOne({
        _id: mongoose.Types.ObjectId(invId),
        // status: 1,
        // isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in Invoice DB!');
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
      //   this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  


  // generating a invoice here
  generateInvoice = async (req, res) => {
    try {
      info('Genarating Invoice !');
      let totalQuantityDemanded = 0,
        totalQuantitySupplied = 0,
        totalAmount = 0,
        totalTax = 0,
        totalDiscount = 0,
        totalNetValue = 0,
        totalQuantityDemandedItemWise = {},
        totalQuantitySuppliedItemWise = {},
        totalWeight=0;
      let pickerBoySalesOrderMappingId = req.params.pickerBoySalesOrderMappingId || req.body.pickerBoySalesOrderMappingId; // pickerBoySalesOrderMappingId 

      // getting the basket items

      let basketItemData = await pickerBoySalesOrderMappingctrl.viewOrderBasketInternal(pickerBoySalesOrderMappingId);


      // basket item data check 
      if (basketItemData.success) {
        // change status of SO to partiallyfulfilled
        let getTotalSuppliedItemsCount = await invoicePickerBoySalesOrderMappingctrl.getSuppliedItemsCount(basketItemData.data[0].salesOrderId
          )
        // change status of SO to partiallyfulfilled or fullfilled
        let soStatus=2;//fulfilled

        for(var i=0;i<getTotalSuppliedItemsCount.data.length;i++){
          let v = getTotalSuppliedItemsCount.data[i];
          totalQuantitySuppliedItemWise[v.itemId]=totalQuantitySuppliedItemWise[v.itemId]||0+ v.count;
          totalQuantitySupplied=totalQuantitySupplied+v.count//needed for partially fulfilled scenario
        }
        //perform the invoice calculation
        var cartItems=basketItemData.data[0].cartItems[0].itemDetails;

        //calculating the total quantity demanded

        await basketItemData.data[0].salesOrdersDetails.orderItems.map((v, i) => {
          totalQuantityDemanded = v.quantity + totalQuantityDemanded;
          totalQuantityDemandedItemWise[v.itemId]=v.quantity;

        });
        //calculating the total quantity supplied 
        //to-do cart items locationn changes
        cartItems= cartItems.map((v, i) => {
          totalQuantitySupplied = v.suppliedQty + totalQuantitySupplied
          totalQuantitySuppliedItemWise[v.itemId]=totalQuantitySuppliedItemWise[v.itemId]||0+ v.suppliedQty
          if(totalQuantitySuppliedItemWise[v.itemId]< totalQuantityDemandedItemWise[v.itemId]){
            soStatus=1;
          }
          v.totalSuppliedQuantity = totalQuantitySuppliedItemWise[v.itemId];
          v.requiredQuantity= totalQuantityDemandedItemWise[v.itemId]- totalQuantitySuppliedItemWise[v.itemId]+v.suppliedQty;
          return v
        });
        //in case there is a item which is currently not in card and is unfulfilled
        if(soStatus==2&&totalQuantityDemanded!=totalQuantitySupplied){
          soStatus=1
        }


        //calculating the discount and tax
        for (let item of cartItems) {
          //calculating discount

          let discountForSingleItem = parseFloat((item.discountPercentage / 100 * item.salePrice).toFixed(2))
          let discountForSupliedItem = discountForSingleItem * item.suppliedQty
          totalDiscount = totalDiscount + discountForSupliedItem;

          //calculating selling price after discount

          let amountAfterDiscountForSingle = item.salePrice - discountForSingleItem;
          let amountAfterDiscountForSuppliedItem = amountAfterDiscountForSingle * item.suppliedQty
          totalAmount = totalAmount + amountAfterDiscountForSuppliedItem;

          // calculating the tax amount 

          let taxValueForSingleItem = parseFloat((amountAfterDiscountForSingle * item.taxPercentage / 100).toFixed(2))
          let amountAfterTaxForSingle = amountAfterDiscountForSingle + taxValueForSingleItem;
          let taxValueForSuppliedItem = taxValueForSingleItem * item.suppliedQty
          totalTax = totalTax + taxValueForSuppliedItem;

          //calculating net amount 
          let netValueForSingleItem = amountAfterDiscountForSingle - taxValueForSingleItem;
          let netValueForSuppliedItem = netValueForSingleItem * item.suppliedQty
          totalNetValue = totalNetValue + netValueForSuppliedItem;

          //adding all the values in item object
          item.discountForSingleItem = discountForSingleItem;
          item.amountAfterDiscountForSingle = amountAfterDiscountForSingle;
          item.amountAfterTaxForSingle = amountAfterTaxForSingle;
          item.taxValueForSingleItem = taxValueForSingleItem;
          item.netValueForSingleItem = netValueForSingleItem;


        }

        basketItemData.data[0].totalQuantitySupplied = totalQuantitySupplied
        basketItemData.data[0].totalQuantityDemanded = totalQuantityDemanded
        basketItemData.data[0].totalAmount = totalAmount
        basketItemData.data[0].totalTax = totalTax
        basketItemData.data[0].totalDiscount = totalDiscount
        basketItemData.data[0].totalNetValue = totalNetValue
        // if basket data not exist 


        //adding the invoice details in DB
              // creating a custom application id
      let cityInit = 'DEF'; // DEFAULT
      if(req.user){
      if (req.user.region[0] == 'coimbatore')
        cityInit = 'COI'; // Mumbai
      if (req.user.region[0] == 'hyderabad')
        cityInit = 'HYD'; // Bengaluru
      if (req.user.region[0] == 'padappai')
        cityInit = 'PAD'; // Pune
      if (req.user.region[0] == 'gummidipoondi')
        cityInit = 'GUM'; // Thane
      if (req.user.region[0] == 'chennai')
        cityInit = 'CHN'; // Chennai
      if (req.user.region[0] == 'bangalore')
        cityInit = 'BEN'; // Kanchipuram
      if (req.user.region[0] == 'tiruppur')
        cityInit = 'TIR'; // Kanchipuram
      }
      
      let dateToday = new Date();
      let dataToInsert = {
          'invoiceDate': dateToday,
          totalQuantitySupplied,
          totalQuantityDemanded,
          totalAmount,
          totalTax,
          totalDiscount,
          totalNetValue,
          'itemSupplied': JSON.parse(JSON.stringify(cartItems)),
          'invoiceDetails':{
            invoiceDate:dateToday
          }
          
        }
       // inserting data into the db 
        let newInvoice = await Model.create(dataToInsert);
        let invoiceNo=`INV/${cityInit}/${dateToday.getFullYear()}/${pad(parseInt(dateToday.getMonth() + 1), 2)}/${pad(parseInt(newInvoice.seq % 9999999999), 10)}`

        let isUpdated = await Model.updateOne({
          '_id': mongoose.Types.ObjectId(newInvoice._id)
        }, {
          'invoiceDetails.invoiceNo':invoiceNo
        }, {
          lean: true,
          multi: false,
          upsert: false,
          new: true
        })
        // check if inserted 
        if (newInvoice && !_.isEmpty(newInvoice)) {
          info('Invoice Successfully Created !');
          let fulfilmentStatus = 1 //assuming always partialy fullfiled
          if(totalQuantityDemanded === totalQuantitySupplied){

            fulfilmentStatus = 2 // fullfilled
          }
          salesOrderCtrl.UpdateSalesOrderFullfilmentStatus(basketItemData.data[0].salesOrderId,fulfilmentStatus)
          pickerBoySalesOrderMappingctrl.updateFullfilmentStatus(pickerBoySalesOrderMappingId,fulfilmentStatus)

          //add Invoice no.
          newInvoice.invoiceDetails.invoiceNo=invoiceNo;
          // creating a invoice and picker salesOrder Mapping
          let invoiceSalesOrderMappingObject = {
            pickerBoySalesOrderMappingId,
            invoiceId: newInvoice._id,
            salesOrderId:basketItemData.data[0].salesOrderId
            // createdBy: req.user.email||'aks'
          }

          // create invoice and pickersalesorder mapping
          await invoicePickerBoySalesOrderMappingctrl.create(invoiceSalesOrderMappingObject);

          //changing the state of pickerboy salesorder maaping id to the generate invoice state

          await pickerBoySalesOrderMappingctrl.changeStateToInvoiceGenerated(pickerBoySalesOrderMappingId)
          
          await salesOrderctrl.updateSalesOrderStatus(basketItemData.data[0].salesOrderId,soStatus)

          
          
          // change status to delete for pickerboysalesorderitemsmapping
          // await pickerBoySalesOrderMappingctrl.changeStateToInvoiceGenerated(pickerBoySalesOrderMappingId)

          console.log(isUpdated,newInvoice,"mongoose-------------------")
          
          // returning success

          return this.success(req, res, this.status.HTTP_OK,newInvoice , this.messageTypes.invoiceCreated)
        } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.invoiceNotCreated);

      } else {
        error('Data not in DB');
        return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.invoiceNotCreated);

      }

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

   // generating a invoice here
  getInvoiceDetails = async (req, res) => {
    try {
      info("Get  Invoice Details!");
      let totalWeight = 0;
      let invoiceId = req.params.invoiceId || req.body.invoiceId; // pickerBoySalesOrderMappingId

      // getting the basket items

      var invoiceMappingDetails = await invoicePickerBoySalesOrderMappingctrl.getInvoiceMappingDetails(invoiceId)

      // basket item data check
      if (invoiceMappingDetails && invoiceMappingDetails.success) {

          var salesOrderId = invoiceMappingDetails.data[0].saleOrderId;

          var salesOrderDetails = invoiceMappingDetails.data[0].so[0] || {};
          var warehouseDetails =  (salesOrderDetails.warehouse && salesOrderDetails.warehouse[0] )||{}
          var invoiceDetails = invoiceMappingDetails.data[0].invoice[0] || {};
          let totalAmount=0;
          let totalTaxValue=0
          invoiceDetails['itemSupplied'].forEach((invItem,j)=>{
            salesOrderDetails['item'].forEach((item,i)=>{
              if(item.material_no==invItem.itemId){
                invoiceDetails['itemSupplied'][j].itemName=item.material_description
              }
            })
            invoiceDetails['itemSupplied'][j].unitPrice=Number(invoiceDetails['itemSupplied'][j].total_amount)/invoiceDetails['itemSupplied'][j].quantity;
            invoiceDetails['itemSupplied'][j].totalAmount=Number(invoiceDetails['itemSupplied'][j].total_amount);
            totalAmount=totalAmount+Number(invoiceDetails['itemSupplied'][j].total_amount)
            totalTaxValue=totalTaxValue+Number(invoiceDetails['itemSupplied'][j].taxable_value)
          })
          let qrCode = await QRCode.toDataURL(invoiceDetails['invoiceDetails']['signed_qrcode'],{type:'terminal'});

            let InvoiceDetailsResponse={
              invoiceId:invoiceDetails._id,
              customerName:invoiceDetails.customerName,
              invoiceNo:invoiceDetails.invoiceDetails.invoiceNo,
              invoiceDate:invoiceDetails.createdAt,
              paymentMode:salesOrderDetails.paymentMode,
              signed_qrcode:qrCode,
              // totalWeight:'NA',
              invoiceStatus:'Order Packed',
              soInvoiceNumber:salesOrderDetails.invoiceNo,
              soOrderDate:salesOrderDetails.created_at,
              deliveryDate:salesOrderDetails.delivery_date,
              deliveryNumber:'NA',
              legacyInvoiceNo:'NA',
              sapId:'NA',
              erpId:'NA',
              customerPONumber:'NA',
              customerPODate:'NA',
              deliveryExecutiveName:'NA',
              // cgst:invoiceDetails.totalTax/2,
              // sgst:invoiceDetails.totalTax/2,
              // totalDiscount:invoiceDetails.totalDiscount,
              // totalAmount:invoiceDetails.totalAmount,
              // totalNetValue:invoiceDetails.totalNetValue,
              // itemsOrdered:invoiceDetails.itemSupplied,
              invoiceDetail:invoiceDetails,
              basketTotal: totalAmount-totalTaxValue,
              finalTotal:totalAmount,
              totalDiscount:Number(invoiceDetails.totalDiscount),
              cgst:Math.round((totalTaxValue/2)*100)/100,
              sgst:Math.round((totalTaxValue/2)*100)/100,
              gstNo:'NA',
              warehouseDetails:warehouseDetails
            }

            // Set isInvoiceViewed to true on view invoice details
            await invoiceMastermodel.findOneAndUpdate({ _id: invoiceId }, {$set: { isInvoiceViewed: 1} });

            return this.success(req, res, this.status.HTTP_OK,InvoiceDetailsResponse , this.messageTypes.invoiceDetailsSent);
          } 
      else {
        error("Data not in DB");
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.invoicesDetailsNotFound
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
  }

  
  



  getInvoices = async (req,res,next) => {
    
    try {

      info('Getting the todays Order !!!');
      
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.searchKey || '',
        
        sortBy = req.query.sortBy || 'createdAt',
        skip = parseInt(page - 1) * pageSize,
        locationId = 0, // locationId req.user.locationId || 
        cityId = 'N/A', // cityId req.user.cityId ||
        
        startDate = req.query.startDate || moment().subtract(100, 'days').set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate(),
        endDate = req.query.endDate || moment().set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0
        }).toDate(),
        type = req.params.type,
        // plant = req.body.plant,
        sortingArray = {};
      sortingArray[sortBy] = -1;
    console.log(startDate,endDate)
  
   
      if (startDate && !_.isEmpty(startDate)) {


        startDate = moment(startDate, "DD-MM-YYYY").set({
          h: 0,
          m: 0,
          s: 0,
          millisecond: 0
        }).toDate();

    
      }

      if (endDate && !_.isEmpty(endDate)) {


        endDate = moment(endDate, "DD-MM-YYYY").set({
          h: 24,
          m: 24,
          s: 0,
          millisecond: 0
        }).toDate();

    
      }
      info('Get Invoices !');
      
      let pipeline= [{
        $match:{
         
          'createdAt':{$gte:startDate,$lte:endDate}
         
          
      }},
      {$lookup:{
        from:'pickerboyordermappings',
        let:{
          id:'$_id'
        },
        pipeline:[{
          $match:{
            $expr: {
            $eq:['$$id','$invoiceDetail.invoice.invoiceDbId']
            }
          }
          
        },{
          
          $project:{
            isInvoiceRequest:1,
            remarks:1,
            picking_date:1,
            delivery_date:1,
            pickerBoyId:1,
            invoice_request:1,
            invoice_response:1,
            isSapError:1
          }
        }
   ],
        as: "ordermapping"

      }
    },{$unwind:'$ordermapping'},
    {$project:{
      '_id': 1,
                'isSelected': 1,
                'isDelivered': 1,
                'isInvoiceViewed': 1,
                'soId': 1,
                'so_db_id':1,
                'so_deliveryDate': 1,
                'deliveryNo': 1,
                'cityId': 1,
                'customerName':1,
                'companyDetails': 1,
                'payerDetails': 1,
                'shippingDetails':1,
                'invoiceDetails': 1,
                'invoiceDate': 1,
                'totalQuantitySupplied': 1,
                'totalQuantityDemanded': 1,
                'totalAmount': 1,
                'totalTax': 1,
                'totalDiscount': 1,
                'totalNetValue': 1,
                'itemSupplied':1,
                'totalWeight': 1,
                'createdAt': 1,
                'updatedAt':1,
                'seq': 1,
                
                'SAP_PICKING_ALLOCATION_REMARKS':'$ordermapping.remarks',
                'Order State':'$ordermapping.state',
                'isDeleted':'$ordermapping.isDeleted',
                'delivery_no':'$ordermapping.delivery_no',
                'picking_date':'$ordermapping.picking_date',
                'delivery_date':'$ordermapping.delivery_date',
                'pickerBoyId':'$ordermapping.pickerBoyId',
                'createdAt':1,
                'updatedAt':1,
                'invoice_request':'$ordermapping.invoice_request',
                'invoice_response':'$ordermapping.invoice_response',
                'isSapError':'$ordermapping.isSapError',
                'picking_allocation_request':'$ordermapping.picking_allocation_request',
                'picking_allocation_response':'$ordermapping.picking_allocation_response',
    }},
    {
      $sort:{
        'createdAt':-1
      }
    }
    

    ]


     
      if (searchKey !== '')
 pipeline= [{
  $match:{
    'createdAt':{$gte:startDate,$lte:endDate},
  
  $or: [{
    'customerName': {
      $regex: searchKey,
      $options: 'is'
    }
  }, {
    'shippingDetails.name': {
      $regex: searchKey,
      $options: 'is'
    }
  }, {
    'shippingDetails.gstNo': {
      $regex: searchKey,
      $options: 'is'
    }
  }, {
    'shippingDetails.mobileNo': {
      $regex: searchKey,
      $options: 'is'
    }
  },
  {
    'cityId': {
      $regex: searchKey,
      $options: 'is'
    }
  },
  {
    'deliveryNo': {
      $regex: searchKey,
      $options: 'is'
    }
  },
  {
    'soId': {
      $eq: parseInt(searchKey),
   
    }
  },
  {
    'invoiceDetails.invoiceNo': {
      $regex: searchKey,
      $options: 'is'
    }
  }
]

}
},
{$lookup:{
  from:'pickerboyordermappings',
  let:{
    id:'$_id'
  },
  pipeline:[{
    $match:{
      $expr: {
      $eq:['$$id','$invoiceDetail.invoice.invoiceDbId']
      }
    }
    
  },{
    
    $project:{
      isInvoiceRequest:1,
      remarks:1,
      picking_date:1,
      delivery_date:1,
      pickerBoyId:1,
      invoice_request:1,
      invoice_response:1,
      isSapError:1
    }
  }
],
  as: "ordermapping"

}
},{$unwind:'$ordermapping'},
{$project:{
'_id': 1,
          'isSelected': 1,
          'isDelivered': 1,
          'isInvoiceViewed': 1,
          'soId': 1,
          'so_db_id':1,
          'so_deliveryDate': 1,
          'deliveryNo': 1,
          'cityId': 1,
          'customerName':1,
          'companyDetails': 1,
          'payerDetails': 1,
          'shippingDetails':1,
          'invoiceDetails': 1,
          'invoiceDate': 1,
          'totalQuantitySupplied': 1,
          'totalQuantityDemanded': 1,
          'totalAmount': 1,
          'totalTax': 1,
          'totalDiscount': 1,
          'totalNetValue': 1,
          'itemSupplied':1,
          'totalWeight': 1,
          'createdAt': 1,
          'updatedAt':1,
          'seq': 1,
          
          'SAP_PICKING_ALLOCATION_REMARKS':'$ordermapping.remarks',
          'Order State':'$ordermapping.state',
          'isDeleted':'$ordermapping.isDeleted',
          'delivery_no':'$ordermapping.delivery_no',
          'picking_date':'$ordermapping.picking_date',
          'delivery_date':'$ordermapping.delivery_date',
          'pickerBoyId':'$ordermapping.pickerBoyId',
          'createdAt':'$ordermapping.createdAt',
          'updatedAt':'$ordermapping.updatedAt',
          'invoice_request':'$ordermapping.invoice_request',
          'invoice_response':'$ordermapping.invoice_response',
          'isSapError':'$ordermapping.isSapError',
          'picking_allocation_request':'$ordermapping.picking_allocation_request',
          'picking_allocation_response':'$ordermapping.picking_allocation_response',
}},{
  $sort:{
    'createdAt':-1
  }
}
  // status: 1,
  // isDeleted: 0
]


      // get details 
      return await Model.aggregate(pipeline).then((result) => {
        // console.log(result)
        if (result && !_.isEmpty(result)) {
          // return {
          //   success: true,
          //   data: res
          // }

          const json2csv = new Parser()

          try {
            return this.success(req, res, this.status.HTTP_OK,result , this.messageTypes.invoiceDetailsSent);
              // const csv = json2csv.parse(result)
              // res.attachment(`report-${moment(startDate).format('DD:MM:YY')}-${moment(endDate).format('DD:MM:YY')}.csv`)
              // res.status(200).send(csv)
          } catch (error) {
              console.log('error:', error.message)
              res.status(500).send(error.message)
          }
       

          // return this.success(req, res, this.status.HTTP_OK,result , this.messageTypes.invoiceDetailsSent);
        } else {
          error('Error Searching Data in invoice DB!');
          // return {
          //   success: false
          // }
          return this.errors(
            req,
            res,
            this.status.HTTP_CONFLICT,
            this.messageTypes.invoicesDetailsNotFound
          );
        }
      }).catch(err => {
        error(err);
        // return {
        //   success: false,
        //   error: err
        // }
        return this.errors(
          req,
          res,
          this.status.HTTP_CONFLICT,
          this.messageTypes.invoicesDetailsNotFound
        );
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
     return this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        this.exceptions.internalServerErr(req, err)
      );
        // this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  
}

// exporting the modules 
module.exports = new invoiceMasterController();
