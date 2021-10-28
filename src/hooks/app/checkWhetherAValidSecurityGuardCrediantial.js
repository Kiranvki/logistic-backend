// Controller
const securityGuardCtrl = require("../../components/employee/security_guard/security_guard.controller");

// Responses & others utils
const Response = require("../../responses/response");
const StatusCodes = require("../../facades/response");
const MessageTypes = require("../../responses/types");
const Exceptions = require("../../exceptions/Handler");
const { error, info } = require("../../utils").logging;

// exporting the hooks
module.exports = async (req, res, next) => {
  try {
    info("Check whether the security guard exist or not !");

    let type = req.params.type, // type
      mobileNumber = req.body.mobileNumber || undefined, // getting the mobile number
      email = req.body.email || undefined; // getting the email

    // getting the security details
    let securityGuardDetails = await securityGuardCtrl.getDetailsUsingField(
      parseInt(mobileNumber) || email
    );
    console.log(securityGuardDetails);
    // if security Guard details not found
    if (securityGuardDetails.success) {
      info("Security Guard Details Fetched Successfully");
      req.body.securityGuardDetails = securityGuardDetails.data;
      return next();
    } else {
      error("Invalid Security Guard!");
      return Response.errors(
        req,
        res,
        StatusCodes.HTTP_CONFLICT,
        MessageTypes.appUserOnBoard.invalidUserCred(
          type == "sms" ? "mobile number" : "email"
        )
      );
    }

    // catch any runtime error
  } catch (e) {
    error(e);
    return Response.errors(
      req,
      res,
      StatusCodes.HTTP_INTERNAL_SERVER_ERROR,
      Exceptions.internalServerErr(req, e)
    );
  }
};
