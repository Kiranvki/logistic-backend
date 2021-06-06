const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autopopulate = require('mongoose-autopopulate');
const autoIncrement = require('mongoose-sequence')(mongoose);
// schema
const invoiceMaster = new Schema({

  soId: {  //sales_order_no
    type: Number
  },
  
  so_db_id: {
    type: Schema.Types.ObjectId,
    ref: 'salesOrder'
  },

  so_deliveryDate: {  //sap delivery_date
    type: Date
  },
  stoPoNumber : {  //sto_po_no
    type: Number
  },
              stockTransferDbId: {
                type: Schema.Types.ObjectId,
                ref: 'purchase_order'
              },
            
              stockTransferDeliveryDate: {  //sap delivery_date
                type: Date
              },
  deliveryNo:{
    type:String
  },

  isSelected: {
    type: Boolean,
    default: false
  },

  'cityId': {
    type: 'String',
    // enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
  },

  customerName: {
    type: String
  },

  'companyDetails':
  {
    'name': {
      type: 'String',
    },
    'address': {
      type: 'String',
    },
    'telephoneNo': {
      type: 'String',
    },
    'pinCode': {
      type: 'Number',
    },
    'gstNo': {
      type: 'String',
    },
    'email': {
      type: 'String',
    },
    'cinNo': {
      type: 'String',
    },
    'websiteInfo': {
      type: 'String',
    },
    'contactNo': {
      type: 'Number',
    },
    'fssaiNo': {
      type: 'Number',
    },
    'cityId': {
      type: 'String',
      // enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
    },
  },

  'payerDetails': //payers
  {
    'name': {
      type: 'String',
    },
    'address': {
      type: 'String',
    },
    'mobileNo': {
      type: 'String',
    },
    'gstNo': {
      type: 'String',
    },
    'email': {
      type: 'String',
    },
    'cityId': {
      type: 'String',
      // enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
    },
  },

  'shippingDetails':  //sold_to_party  //bill_to_party
  {
    'name': {
      type: 'String',
    },
    'address1': {
      type: 'String',
    },
    'address2': {
      type: 'String',
    },
    'address3': {
      type: 'String',
    },
    'pan':{
      type: 'String',
    },
    'country':{
      type: 'String',
    },
    
    'mobileNo': {
      type: 'String',
    },
    'gstNo': {
      type: 'String',
    },
    'email': {
      type: 'String',
    },
    'cityId': {
      type: 'String',
      // enum: ['coimbatore', 'hyderabad', 'padappai', 'gummidipoondi', 'chennai', 'bangalore']
    },
  },

  'invoiceDetails':
  {
    'invoiceNo': { //invoice_no
      type: 'String',
    },
    'invoiceDate': {  //billing_date in sap billing_date
      type: 'Date',
    },
    'legacyInvoiceNo': {  //not in sap
      type: 'String',
    },
    'sapID': { //invoice no
      type: 'String',
    },
  
    'billing_type':{ //sap field
      type:String
    },
    'sales_Org': { //sap field
      type:String
    },
    'distribution_channel':{ //sap field
      type:String
    },
    'division': { //sap field
      type:Number
    },
   
    'customer_price_group': { //sap field
      type:String
    },
    'customer_group': {  //sap field
      type:String
    },
    'inco_terms': { //sap field
      type:String
    },
    'payment_terms': {  //sap field
      type:String
    },
    'company_code': {  //sap field
      type:String
    },
    'account_assignment_group': { //sap field
      type:String
    },
    'sold_to_party': {// SAP sold_to_party customer id
      type:String
    },
  
    'bill_to_party':{  //sap field
      type:String
    },
    'payer':{  //sap payer
      type:String
    },

    'erpId': { //not reqwuirreed
      type: 'String',
    },
    'customerPoNo': { //not in sap
      type: 'String',
    },
    'customerPoDate': { //not in sap
      type: 'Date',
    },
    'deliveryNo': {  //delivery_no
      type: 'String',
    },
    'paymentTerms': { //payment_terms
      type: 'String',
    },
    'deliveryFrom': { //shipping_point
      type: 'String',
    },
  },

  // SAP fields
  /*
  'itemDetails': [
    {
      'hsnCode': {
        type: 'String',
      },
      'materialDescription': {
        type: 'String',
      },
      'uom': {
        type: 'String',
      },
      'mrp': {
        type: 'Number',
      },
      'pricePerunit': {
        type: 'Number',
      },
      'quantity': {
        type: 'Number',
      },
      'basePrice': {
        type: 'Number',
      },
      'cgstPercentage': {
        type: 'Number',
      },
      'cgstAmount': {
        type: 'Number',
      },
      'sgstPercentage': {
        type: 'Number',
      },
      'sgstAmount': {
        type: 'Number',
      },
      'total': {
        type: 'Number',
      },
    }],
    */
  'invoiceDate': {  //billing_date
    type: 'Date',
  },

  'totalQuantitySupplied': {  //calculate
    type: 'String',
  },
  'totalQuantityDemanded': {  //calculate
    type: 'String',
  },
  'totalAmount': {        //calculate
    type: 'String',
  },
  'totalTax': {           //calculate
    type: 'String',
  },
  'totalDiscount': {      //calculate
    type: 'String',
  },
  'totalNetValue': {     //calculate
    type: 'String',
  },
  'isDelivered': {
    type: 'Number',
    default: 0
  },
  'itemSupplied': [
    {

      'item_no':{ //sap field row number
        type:String
      },
      'itemId': { //material
        type: String
      },
      'item_category':{
        type:String
      },
      'plant':{
        type:String
      },
      'uom':{
        type:String
      },


      'itemName': { //not available
        type: 'String'
      },

      'salePrice': {  // sap mrp_amount
        type: 'Number'
      },
      'quantity': {  
        type: 'Number'
      },
      'suppliedQty': { //sap  qty
        type: 'Number'
      },
      'itemAmount': {  //net_price
        type: 'Number'
      },

      'taxPercentage': {
        type: 'Number'
      },

      'discountAmount': { //discount_amount
        type: 'String'
      },
      'taxable_value':{  //taxable_value sap
        type:String
      },
      'cgst_pr': {
        type:String
      },
      'sgst_pr': {
        type:String
      },
      'igst_pr':{
        type:String
      },
      'ugst_pr': {
        type:String
      },


      'total_amount':{ //sap total_amount
        type:String
      },
      'freeQty': {
        type: 'Number'
      },
      'discountForSingleItem': {
        type: 'Number'
      },

      'amountAfterDiscountForSingle': {
        type: 'Number'
      },
      'amountAfterTaxForSingle': {
        type: 'Number'
      },
      'taxValueForSingleItem': {
        type: 'Number'
      },
      'netValueForSingleItem': {
        type: 'Number'
      },
      'weightInKg': {
        type: Number
      },
      'totalSuppliedQuantity': {
        type: Number
      },
      'requiredQuantity': {
        type: Number
      },
    }
  ],
  
  'totalWeight': {
    type: String
  },
  'seq': {
    type: Number
  },
  'isInvoiceViewed': {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

//Populate User Name for Stage Verification
invoiceMaster.plugin(autopopulate);

// Mongoose Auto Increement 
invoiceMaster.plugin(autoIncrement, {
  inc_field: 'seq'
});

invoiceMaster.index({

});

class invoiceMasterClass{
  static async addInvoice(obj){
    let isExist = this.count({'invoiceDetails.invoice_no':obj.invoice_no})
    
    let invoiceDetail =  await new this(obj).save()
    console.log('from db',invoiceDetail)
    return invoiceDetail.toObject()
    

    // return await this.find({'_id':pickerBoyOrderMappingData._id}).populate('salesOrderId');
    

  }
}
invoiceMaster.loadClass(invoiceMasterClass)
// exporting the entire module
module.exports = mongoose.model('invoiceMaster', invoiceMaster);