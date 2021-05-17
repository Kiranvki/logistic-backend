const request = require("request-promise");
const moment = require("moment");

// Responses & others utils
const Response = require("../../responses/response");
const StatusCodes = require("../../facades/response");
const MessageTypes = require("../../responses/types");
const Exceptions = require("../../exceptions/Handler");
const { error, info } = require("../../utils").logging;
const stiGRNGenerateUrl =
  (process.env.sapBaseUrl || "") + (process.env.stiGRNGenerateUrl || "");

var hitSapApiOfGRN = async (stiReceivingDetails, stiDetails) => {
  try {
    let body = createRequestObject(
      stiReceivingDetails,
      stiDetails
    );
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

    return await request(options);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
var createRequestObject = (stiReceivingDetails, stiDetails) => {
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
      delivery_item: item.higher_level_item||item.delivery_item_no,
      devlivery_no:stiDetails.delivery_no,
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
