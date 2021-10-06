const request = require("request-promise");
const moment = require("moment");
const Model = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in_GRN/models/stock_transfer_in_GRN.model");
const grnCtrl = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in_GRN/stock_transfer_in_GRN.controller");
const stiReceivingDetailsCtrl = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in_receiving_details/stock_transfer_in_receiving_details.controller");
const stiCtrl = require("../../components/picker_app/internal_stock_transfer/stock_transfer_in/stock_transfer_in.controller");

// Responses & others utils
const Response = require("../../responses/response");
const StatusCodes = require("../../facades/response");
const MessageTypes = require("../../responses/types");
const Exceptions = require("../../exceptions/Handler");
const { error, info } = require("../../utils").logging;
const stiGRNGenerateUrl =
  (process.env.sapBaseUrl || "") + (process.env.stiGRNGenerateUrl || "");

var updateReceivingStatus = async (req, stiReceivingDetails, stiDetails)=>{
  let resetPickingStatus = await stiReceivingDetailsCtrl.modifySti({
    _id:stiReceivingDetails._id,status:1,isDeleted:0
  },{
      status:0,isDeleted:1
  });
  let resetPickingStatusSti = await stiCtrl.modifySti({
    _id:stiDetails._id,status:1,isDeleted:0
  },{
    receivingStatus:0
  });
}

var hitSapApiOfGRN = async (req, stiReceivingDetails, stiDetails) => {
  try {
    let body = createRequestObject(req, stiReceivingDetails, stiDetails);
    let options = {
      method: "POST",
      uri: stiGRNGenerateUrl,
      headers: {
        "Content-Type": "application/json",
      },
      json: true,
      body: body,
    };
    console.log(options);
    try {
      req.body.grnApiOptions = options;
      return await request(options);
    } catch (err) {
      let insertedRecord = await grnCtrl.set({
        status: 2,
        isDeleted: 0,
        stiId:stiDetails._id,
        reqDetails: JSON.stringify(options),
        resDetails: JSON.stringify(err),
        po_number: stiDetails.po_number,
        stiReceivingId: stiReceivingDetails._id,
        delivery_no: stiDetails.delivery_no,
      });
      console.log(insertedRecord);
      await updateReceivingStatus(req,
        stiReceivingDetails,
        stiDetails)
      throw err;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};
var createRequestObject = (req, stiReceivingDetails, stiDetails) => {
  let itemArray = [];
  let todaysDate = moment()
    .set({
      h: 0,
      m: 0,
      s: 0,
      millisecond: 0,
    })
    .format("YYYY-MM-DD");
  stiReceivingDetails.item.forEach((item) => {
    itemArray.push({
      material_no: item.material,
      movement_type: "101",
      quantity: item.received_qty,
      delivery_item: item.higher_level_item || item.delivery_item_no,
      devlivery_no: stiDetails.delivery_no,
      po_number: stiDetails.po_number,
      po_item: item.po_item,
      plant: item.receiving_plant,
    });
  });
  return {
    request: {
      posting_date: todaysDate,
      document_date: todaysDate,
      referance_document_no: stiDetails.delivery_no,
      bill_of_lading: stiDetails.delivery_no,
      header_txt: "",
      Item: itemArray,
    },
  };
};
// exporting the hooks
module.exports = async (req, res, next) => {
  try {
    let stiReceivingDetails = req.body.stiReceivingDetails;
    let stiDetails = req.body.stiDetails;
    try {
      let sapGrnResponse = await hitSapApiOfGRN(
        req,
        stiReceivingDetails,
        stiDetails
      );
      if (
        sapGrnResponse &&
        sapGrnResponse.response &&
        sapGrnResponse.response.flag == "S"
      ) {
        req.body.sapGrnNo = sapGrnResponse.response.material_document_no;
        next();
      } else {
        //to-do remove comment
        let insertedRecord = await grnCtrl.set({
          status: 2,
          isDeleted: 0,
          stiId:stiDetails._id,
          reqDetails: JSON.stringify(req.body.grnApiOptions),
          resDetails: JSON.stringify(sapGrnResponse),
          po_number: stiDetails.po_number,
          stiReceivingId: stiReceivingDetails._id,
          delivery_no: stiDetails.delivery_no,
        });
        console.log(insertedRecord);
        info(sapGrnResponse, "sapGrnResponse-------");
        await updateReceivingStatus(req,
          stiReceivingDetails,
          stiDetails)
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
