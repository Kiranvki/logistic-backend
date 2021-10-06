// Controller
const poCtrl = require("../../components/picker_app/external_purchase_order/purchase_order/purchase_order.controller");
const Model = require("../../components/picker_app/external_purchase_order/purchase_orderGRN/models/purchase_orderGRN.model");
const _ = require("lodash");

// Responses & others utils
const Response = require("../../responses/response");
const StatusCodes = require("../../facades/response");
const MessageTypes = require("../../responses/types");
const Exceptions = require("../../exceptions/Handler");
const mongoose = require("mongoose");
const { error, info } = require("../../utils").logging;
let FULFILMENTSTATUS = {
  partial: 2,
  fulfilled: 1,
};

// padding the numbers
const pad = (n, width, z) => {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

// exporting the hooks
module.exports = async (req, res, next) => {
  try {
    info("Check whether PO Id is valid or not");
    let poReceivingDetails = req.body.poReceivingDetails;
    let poDetails = req.body.poDetails;
    let pickerBoyId = mongoose.Types.ObjectId(req.user._id);
    let receivedItemsMaterialNumber = [];
    var dateToday = new Date();
    var poDeliveryDate = poDetails.delivery_date;
    var vendorInvoiceNo = req.body.vendorInvoiceNumber;
    let fulfilmentStatus = req.body.fulfilmentStatus;

    //filtering basket items based on quantity as for 0 quantity GRN cant be generated
    for (let i = 0; i < poReceivingDetails.item.length; i++) {
      let item = poReceivingDetails.item[i];
      receivedItemsMaterialNumber.push(item.material_no);

      poReceivingDetails.item[i].pending_qty =
        item.quantity - (item.received_qty ? item.received_qty : 0);
    }
    req.body.receivedItemsMaterialNumber = receivedItemsMaterialNumber;

    let grnCreateData = {
      sapGrnNo: req.body.sapGrnNo,
      poReceivingId: poReceivingDetails._id,
      po_number: poDetails.po_number,
      receivingStatus:
        fulfilmentStatus == FULFILMENTSTATUS.fulfilled
          ? FULFILMENTSTATUS.fulfilled
          : FULFILMENTSTATUS.partial,
      fulfilmentStatus: fulfilmentStatus,
      document_date: poDetails.document_date,
      delivery_date: poDeliveryDate,
      delivery_date_array: poDetails.delivery_date_array,
      poAmount: poReceivingDetails.total,
      netTotal: poReceivingDetails.netValue,
      totalTaxAmount: poReceivingDetails.totalTax,
      discount: poReceivingDetails.totalDiscount,
      generatedBy: pickerBoyId,
      item: poReceivingDetails.item,
      vendorInvoiceNo: vendorInvoiceNo,
      supplierDetails: {
        vendor_no: poDetails.vendor_no,
        vendor_name: poDetails.vendor_name,
      },
    };
    var grnDetails = await Model.create(grnCreateData);
    let grnNo = `GRN${dateToday.getFullYear()}${pad(
      parseInt(dateToday.getMonth() + 1),
      2
    )}${pad(parseInt(dateToday.getDay()), 2)}${pad(
      parseInt(grnDetails.sequence % 99999),
      5
    )}`;

    let isUpdated = await Model.updateOne(
      {
        _id: mongoose.Types.ObjectId(grnDetails._id),
      },
      {
        grnNo: grnNo,
      },
      {
        lean: true,
        multi: false,
        upsert: false,
        new: true,
        useFindAndModify: false,
      }
    );

    if (grnDetails && !_.isEmpty(grnDetails)) {
      info("GRN Successfully Created !");
      //add Invoice no.
      grnDetails.grnNo = grnNo;
      grnDetails.poVendorNumber = "NA";
      grnDetails.poVendorDate = "NA";
      req.body.grnDetails = grnDetails;
      next();
    } else {
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.purchaseOrder.grnNotGenerated
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
