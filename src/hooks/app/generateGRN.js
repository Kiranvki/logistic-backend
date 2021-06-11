const request = require("request-promise");
const moment = require("moment");
const grnCtrl = require("../../components/picker_app/external_purchase_order/purchase_orderGRN/purchase_orderGRN.controller");

// Responses & others utils
const Response = require("../../responses/response");
const StatusCodes = require("../../facades/response");
const MessageTypes = require("../../responses/types");
const Exceptions = require("../../exceptions/Handler");
const mongoose = require("mongoose");
const { error, info } = require("../../utils").logging;
const grnGenerateUrl =
  (process.env.sapBaseUrl || "") + (process.env.grnGenerateUrl || "");

var hitSapApiOfGRN = async (req,poReceivingDetails, poDetails, vendorInvoiceNo) => {
  try {
    let body = createRequestObject(
      req,
      poReceivingDetails,
      poDetails,
      vendorInvoiceNo
    );
    let options = {
      method: "POST",
      uri: grnGenerateUrl,
      headers: {
        "Content-Type": "application/json",
      },
      json: true,
      body: body,
    };
    console.log(options);
    try{
      req.body.grnApiOptions=options;
      return await request(options);
    }catch(err){
      let insertedRecord = await grnCtrl.set({
        status: 2,
        isDeleted: 0,
        poId:poDetails._id,
        reqDetails: JSON.stringify(options),
        resDetails: JSON.stringify(err),
        po_number: poDetails.po_number,
        poReceivingId: poReceivingDetails._id,
      });
      console.log(insertedRecord);
      throw err;
    }
  } catch (err) {

    console.log(err);
    throw err;
  }
};
var createRequestObject = (req,poReceivingDetails, poDetails, vendorInvoiceNo) => {
  let itemArray = [];
  let todaysDate = moment()
    .set({
      h: 0,
      m: 0,
      s: 0,
      millisecond: 0,
    })
    .format("YYYY-MM-DD");
  poReceivingDetails.item.forEach((item) => {
    itemArray.push({
      material_no: item.material_no,
      movement_type: [],
      quantity: item.received_qty,
      po_number: poDetails.po_number,
      po_item: item.item_no,
      plant: item.plant,
      storage_location: item.storage_location,
    });
  });
  return {
    request: {
      posting_date: todaysDate,
      document_date: todaysDate,
      referance_document_no: poDetails.po_number,
      delivery_note: vendorInvoiceNo,
      bill_of_lading: vendorInvoiceNo,
      header_txt: [],
      Item: itemArray,
    },
  };
};
// exporting the hooks
module.exports = async (req, res, next) => {
  try {
    let poReceivingDetails = req.body.poReceivingDetails;
    let poDetails = req.body.poDetails;
    var vendorInvoiceNo = req.body.vendorInvoiceNumber;
    try {
      let sapGrnResponse = await hitSapApiOfGRN(
        req,
        poReceivingDetails,
        poDetails,
        vendorInvoiceNo
      );
      if (
        sapGrnResponse &&
        sapGrnResponse.response &&
        sapGrnResponse.response.flag == "S"
      ) {
        req.body.sapGrnNo = sapGrnResponse.response.material_document_no;
        next();
      } else {
        let insertedRecord = await grnCtrl.set({
          status: 2,
          isDeleted: 0,
          poId:poDetails._id,
          reqDetails: JSON.stringify(req.body.grnApiOptions),
          resDetails: JSON.stringify(sapGrnResponse),
          po_number: poDetails.po_number,
          poReceivingId: poReceivingDetails._id,
        });
        console.log(insertedRecord);
        //to-do remove comment
        info(sapGrnResponse, "sapGrnResponse-------");
        return Response.errors(
          req,
          res,
          StatusCodes.HTTP_CONFLICT,
          MessageTypes.purchaseOrder.grnNotGeneratedinSAP
        );
      }
    } catch (err) {
      //remove comment
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.purchaseOrder.grnNotGeneratedinSAP
      );
    }

    // catch any runtime error
  } catch (e) {
    error(e);
    Response.errors(
      req,
      res,
      StatusCodes.HTTP_INTERNAL_SERVER_ERROR,
      Exceptions.internalServerErr(req, e)
    );
  }
};
