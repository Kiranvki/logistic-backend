// Controller
//const pickerBoyCtrl = require('../../components/picker_app/employee/picker_boy/picker_boy.controller');
const invoiceMasterModel = require('../../components/picker_app/invoice_master/models/invoice_master.model');
// Responses & others utils 

const pickerBoyOrderMappingModel = require('../../components/picker_app/pickerboy_salesorder_mapping/models/pickerboy_salesorder_mapping.model')
const invoicePickerBoySalesOrderMappingctrl = require('../../components/picker_app/invoice_pickerboysalesorder_mapping/invoice_pickerboysalesorder_mapping.controller')
const Response = require('../../responses/response');
const _ = require('lodash');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const {
    error,
    info
} = require('../../utils').logging;

// exporting the hooks 
module.exports = async (req, res, next) => {
    try {
        info('Updating SAP Invoice Detail to DB !');
console.log('inv upload',req.body.invoice_detail)
        let pickerBoyOrderMappingId = req.params.pickerBoyOrderMappingId, // type 
            deliveryDetail = req.body.delivery_detail || undefined, // getting the SAP delivery Detail
            invoiceDetail = req.body.invoice_detail['data'][0] || undefined,
            OrderData = req.body.orderDetail,
           total_quantity = 0,
            total_quantity_demanded = 0,
           total_amount = 0,
           total_tax = 0,
          total_discount = 0,
          total_net_value = 0,
          fullfiled = 2,//completely fullfiled
          total_weight = 0;
        
        const invoiceItemSuppliedArr = []
        //    console.log('delivery',deliveryDetail,'invoiceDetail',invoiceDetail,'OrderData',OrderData)
        invoiceDetail['item'].forEach((data)=>{
          total_quantity = total_weight = total_quantity_demanded += data['qty'];
          total_amount += data['total_amount'];  //parseInt then convert to string
          total_tax += data['taxable_value']; //parseInt then convert to string
          total_discount += data['discount_amount'];  //parseInt then convert to string
          total_net_value += data['total_amount'];  //parseInt then convert to string

          invoiceItemSuppliedArr.push({
      
              'item_no':data['item_no'],
              'itemId':data['material'],  //material
              
              'item_category':data['item_category'],
              
              'plant':data['plant'],
            
              'uom':data['uom'],
            
        
        
              'itemName': data['itemName'], //not available
          
        
              'salePrice':(data['net_price']/data['qty']),                       //data['mrp_amount'],   // sap mrp_amount // change with selling_price
        
              'quantity': data['qty'],  
        
              'suppliedQty':data['qty'],  //sap  qty
        
              'itemAmount':data['net_price'],   //net_price
          
        
              'taxPercentage': 0,
        
        
              'discountAmount':data['discount_amount'],  //discount_amount
        
              'taxable_value':data['taxable_value'],  //taxable_value sap
        
              'cgst_pr': data['cgst_pr'],
          
              'sgst_pr': data['sgst_pr'],
        
              'igst_pr':data['igst_pr'], 
          
              'ugst_pr': data['ugst_pr'],
        
        
        
              'total_amount':data['total_amount'], //sap total_amount
          
              'freeQty': 0,
              
              'discountForSingleItem': parseInt(data['mrp_amount']) - parseInt(data['discount_amount']),  //use parseInt
            
        
            
          
              'amountAfterTaxForSingle': 0,
          
              'taxValueForSingleItem': 0,
      
              'netValueForSingleItem': 0,
        
              'weightInKg': 1,
            
              'totalSuppliedQuantity': data['qty'],
            
              'requiredQuantity': data['qty']
            
            })
        })  

            let invoiceObj = {
             'soId': OrderData['pickerBoySalesOrderMappingId']['sales_order_no'],
            //  OrderData['pickerBoySalesOrderMappingId']['delivery_date']
              'fullfiled':fullfiled, //fullfiled
              'so_db_id': OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['_id'],
            
              'so_deliveryDate': OrderData['pickerBoySalesOrderMappingId']['delivery_date'],
              'shipping_point':OrderData['pickerBoySalesOrderMappingId']['shipping_point'],
           
              'deliveryNo':req.body.delivery_detail['data']['delivery_no'],
              'cityId': OrderData['pickerBoySalesOrderMappingId']['shipping_point'],
              'customerName': OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['sold_to_party_description'],
            
              'companyDetails':
              {
                'name': 'N/A',
                'address': 'N/A',
                'telephoneNo': 'N/A',
                'pinCode': 0,
                'gstNo': 'N/A',
                'email': 'N/A',
                'cinNo': 'N/A',
                'websiteInfo': 'N/A',
                'contactNo': 0,
                'fssaiNo': 0,
                'cityId': 'N/A'
              },
            
              'payerDetails': //payers
              {
                'name': 'N/A',
                'address': 'N/A',
                'mobileNo': 'N/A',
                'gstNo': 'N/A',
                'email': 'N/A',
                'cityId': 'N/A',
              },
            
              'shippingDetails':  //sold_to_party  //bill_to_party
              {
                'name': 'N/A',
                'address': 'N/A',
                'mobileNo': 'N/A',
                'gstNo': 'N/A',
                'email': 'N/A',
                'cityId': 'N/A',
              },
            

            //   "invoice_no": "0083000742",
            //   "billing_type": "X001",
            //   "sales_Org": 2000,
            //   "distribution_channel": 20,
            //   "division": 21,
            //   "billing_date": 20210201,
            //   "customer_price_group": "01",
            //   "customer_group": "01",
            //   "inco_terms": "FOB",
            //   "payment_terms": "WC08",
            //   "company_code": 2000,
            //   "account_assignment_group": "C1",
            //   "sold_to_party": "0002000002",
            //   "bill_to_party": "0002000002",
            //   "payer": "0002000002",


              'invoiceDetails':
              {
                'invoiceNo': invoiceDetail['invoice_no'], //invoice_no
                 
                'invoiceDate': invoiceDetail['billing_date'],  //billing_date in sap billing_date
             
             
                'sapID': invoiceDetail['invoice_no'], //invoice no
         
                
                'billing_type':invoiceDetail['billing_type'], //sap field
        
                'sales_Org': invoiceDetail['sales_Org'], //sap field
          
                'distribution_channel':invoiceDetail['distribution_channel'], //sap field
            
                'division':invoiceDetail['division'],  //sap field
          
               
                'customer_price_group': invoiceDetail['customer_price_group'], //sap field
        
                'customer_group':invoiceDetail['customer_group'],   //sap field
            
                'inco_terms': invoiceDetail['inco_terms'], //sap field
           
                'payment_terms': invoiceDetail['payment_terms'],  //sap field
            
                'company_code': invoiceDetail['company_code'],  //sap field
             
                'account_assignment_group': invoiceDetail['account_assignment_group'], //sap field
              
                'sold_to_party': invoiceDetail['sold_to_party'],// SAP sold_to_party customer id
              
              
                'bill_to_party':invoiceDetail['bill_to_party'],  //sap field
             
                'payer':  invoiceDetail['payer'],//sap payer
            
            
             
         
                // 'deliveryNo': deliveryDetail.delivery_no,
          
                'paymentTerms': invoiceDetail['payment_terms'], //payment_terms
          
                'deliveryFrom': OrderData['pickerBoySalesOrderMappingId']['shipping_point'] //shipping_point
            
              },
            
            
        
              'invoiceDate':invoiceDetail['billing_date'],
            
              'totalQuantitySupplied':total_quantity,
              'totalQuantityDemanded': total_quantity_demanded,
              'totalAmount':total_amount,
              'totalTax': total_tax,
              'totalDiscount': total_discount,
              'totalNetValue': total_net_value,
              
              'itemSupplied': invoiceItemSuppliedArr,
              
              'totalWeight': total_weight
            
            }
            

          
            
            // req.body.delivery_detail['data']
        // getting the pickerboy details 
        // let pickerBoyDetails = await pickerBoyCtrl.getDetailsUsingField(parseInt(mobileNumber) || email);
        // pickerBoyOrderMappingModel
        // if Picker Boy details not found

        // let inv =   {
        //     "invoice_no": "0083000742",
        //     "billing_type": "X001",
        //     "sales_Org": 2000,
        //     "distribution_channel": 20,
        //     "division": 21,
        //     "billing_date": 20210201,
        //     "customer_price_group": "01",
        //     "customer_group": "01",
        //     "inco_terms": "FOB",
        //     "payment_terms": "WC08",
        //     "company_code": 2000,
        //     "account_assignment_group": "C1",
        //     "sold_to_party": "0002000002",
        //     "bill_to_party": "0002000002",
        //     "payer": "0002000002",
        //     "item": [
        //         {
        //             "item_no": "000010",
        //             "material": "CFB000000000000021",
        //             "item_category": "XTAN",
        //             "plant": 2000,
        //             "qty": "0.000 ",
        //             "uom": "PAK",
        //             "mrp_amount": "0.00 ",
        //             "discount_amount": "0.00 ",
        //             "net_price": "0.00 ",
        //             "taxable_value": "0.00 ",
        //             "cgst_pr": "0.00 ",
        //             "sgst_pr": "0.00 ",
        //             "igst_pr": "0.00 ",
        //             "ugst_pr": "0.00 ",
        //             "total_amount": "0.00 "
        //         }]
        //     }


        // create invoice and pickersalesorder mapping
        



        // console.log('success invoice',invoiceObj)
        if (invoiceObj) {
            info('Invoice Detail Updated Succesfully.')
            // invoice update here query
            let data = await invoiceMasterModel.addInvoice(invoiceObj)
           
           
        let invoiceSalesOrderMappingObject = {
          'pickerBoySalesOrderMappingId':req.params.pickerBoyOrderMappingId,
           'salesOrderId':OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['_id'],
          invoiceId: data._id,
          // salesOrderId:deliveryDetail['salesOrderId']       //basketItemData.data[0].salesOrderId
          // createdBy: req.user.email||'aks'
        }


        let UpdatePickerBoyOrderMappingInvDetail = {
          'fullfiled':fullfiled,
          'customerName': OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['sold_to_party_description'],
          'pickerBoySalesOrderMappingId':req.params.pickerBoyOrderMappingId,
           'salesOrderId':OrderData['pickerBoySalesOrderMappingId']['salesOrderId']['_id'],
          'isInvoice':true,
          'invoiceId':data['_id'],
            'invoice_no':invoiceDetail['invoice_no']
          }
          await pickerBoyOrderMappingModel.updateInvoiceDetail(pickerBoyOrderMappingId,UpdatePickerBoyOrderMappingInvDetail)

        await invoicePickerBoySalesOrderMappingctrl.create(invoiceSalesOrderMappingObject);
          
           
            if (data && !_.isEmpty(data)) 
          req.body.invDetail = data;
            // console.log(data)
            // req.body.delivery_detail =  await pickerBoyOrderMappingModel.updateDeliveryStatus(pickerBoyOrderMappingId,deliveryDetail.delivery_no,deliveryDetail.remarks)
        //    console.log('sucess',req.body.delivery_detail)
            return next();
        } else {
            error('Failed to update !');
            return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.salesOrder.InvoiceUpdateFailed);
        }

        // catch any runtime error 
    } catch (e) {
        error(e);
        return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
    }
};
