// controllers 
//const SalesOrderSyncCtrl = require('../sales_order_sync/sales_order_sync.controller');
const pickerBoySalesOrderMappingctrl = require('../pickerboy_salesorder_mapping/pickerboy_salesorder_mapping.controller');
const invoicePickerBoySalesOrderMappingctrl = require('../invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller');
const salesOrderctrl = require('../../sales_order/sales_order/sales_order.controller');
const pickerboySalesorderItemsMappingctrl = require('../pickerboy_salesorder_items_mapping/pickerboy_salesorder_items_mapping.controller');

const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/invoice_master.model');
const mongoose = require('mongoose');
const _ = require('lodash');
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
  getDetails = async (saleOrderId) => {
    console.log(saleOrderId)
    try {
      info('Get saleOrderId  details !');

      // get details 
      return await Model.findOne({
        _id: mongoose.Types.ObjectId(saleOrderId),
        // status: 1,
        // isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in saleOrder DB!');
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
          pickerBoySalesOrderMappingctrl.updateFullFilmentStatus(pickerBoySalesOrderMappingId,fulfilmentStatus)

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

          var salesOrderDetails = invoiceMappingDetails.data[0].so[0];
          var invoiceDetails = invoiceMappingDetails.data[0].invoice[0];

console.log(salesOrderDetails.created_at,invoiceDetails)
salesOrderDetails['item'].forEach((item,i)=>{
  invoiceDetails['itemSupplied'].forEach((invItem,j)=>{
    if(item.item_no==invItem.item_no){
      invoiceDetails['itemSupplied'][j].itemName=item.material_description
    }

  })
  item['material_description']
})

            let InvoiceDetailsResponse={
              invoiceId:invoiceDetails._id,
              customerName:invoiceDetails.customerName,
              invoiceNo:invoiceDetails.invoiceDetails.invoiceNo,
              invoiceDate:invoiceDetails.invoiceDate,
              paymentMode:salesOrderDetails.paymentMode,
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
              invoiceDetail:invoiceDetails
              
              

            }
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


  
}

// exporting the modules 
module.exports = new invoiceMasterController();
