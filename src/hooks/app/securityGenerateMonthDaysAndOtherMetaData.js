// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const BasicCtrl = require('../../components/basic_config/basic_config.controller');
const moment = require('moment');
const {
  error,
  info
} = require('../../utils').logging;
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']; // month constant 

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Generate the basic structure for getting the attendance !');
    let month = months.indexOf(req.params.month); // getting the index of the month
    let year = parseInt(req.params.year); // getting the year from the params 

    let startDateOfTheMonth = moment([year, month]).startOf("month").toDate(), // get the start date of the month
      endDateOfTheMonth = moment(startDateOfTheMonth).endOf("month").toDate(); // get the end date of the month 

    // injecting into the request body 
    req.body.securityGuardId = req.user._id; // securityGuard id 
    req.body.startDateOfTheMonth = startDateOfTheMonth; // start day of the month 
    req.body.endDateOfTheMonth = endDateOfTheMonth; // end day of the month 

    // move on 
    return next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
