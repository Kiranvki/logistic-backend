// Controller
const imageCtrl = require('../components/file_handler/images/images.controller');

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

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Check whether the user email id is unique or not!');
    let objectId = mongoose.Types.ObjectId; // object id
    let fileId = req.body.fileId || req.params.fileId; // get the asm id 

    // mongoose valid id 
    if (objectId.isValid(fileId)) {

      // check whether the email id is unique or not 
      let isValidFile = await imageCtrl.getFile(fileId)

      // if email is unique
      if (isValidFile.success) {
        info('Valid File')
        req.body.file = isValidFile.data
        next();
      } else {
        error('INVALID File!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.fileHandler.fileNotFound);
      }
    } else {
      error('INVALID File!');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.fileHandler.fileNotFound);
    }

    // catch any runtime error 
  } catch (e) {
    error(e);
    Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
