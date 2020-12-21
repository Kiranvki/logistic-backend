const transporterCtrl= require('../components/transporter/transporter/transporter.controller')

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const mongoose = require('mongoose');
const {
  error,
  info
} = require('../utils').logging;


  

module.exports = async (req, res, next) => {
  try {
    info('Check whether the user email id is unique or not!');

    let transporterId = req.body.transporterId; // get the agency id 

    if (transporterId) {
      // check whether the name is unique or not 
      let isValid = await transporterCtrl.isValid(transporterId);

      // if name exists
      if (isValid.success) {

        // injecting into the request body
        req.body.agencyName = isValid.data.nameToDisplay;

        // MOVE ON 
        next();
      } else {
        error('Agency ID Not Found !'); // route doesnt exist 
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT,  MessageTypes.transporterMaster.transporterIdIsInvalidOrDeactivated);
      }
    } else next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};