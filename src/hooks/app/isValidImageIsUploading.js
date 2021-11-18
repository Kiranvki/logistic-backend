// external controllers
const BasicCtrl = require('../../components/basic_config/basic_config.controller');

// Responses & others utils 
const Response = require('../../responses/response');
const StatusCodes = require('../../facades/response');
const MessageTypes = require('../../responses/types');
const Exceptions = require('../../exceptions/Handler');
const mime = require('mime-types');

// crypto 
const getStream = require('into-stream');
const _ = require('lodash');
const sharp = require('sharp');
const {
  error,
  info
} = require('../../utils').logging;

// converting file size to mb
const bytesToMb = (bytes) => {
  if (bytes == 0) return 0;
  return (bytes / Math.pow(10, 6)).toFixed(1);
}

// maximum file to upload
const validExt = process.env.validImageDocumentMimeTypes || [];

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Uploading the file to server !');
    const maxFileSizeInMbFromConfig = await BasicCtrl.GET_MAX_STOP_IMAGE_FILE_SIZE_IN_MB().then((res) => { if (res.success) return res.data; else return 1; });

    // initializing
    let fileInfo = {};

    console.log("image file===>", req.files)
    // checking if the file is there
    if (req.file) {

      info('FILE FOUND !');

      //creating a new file info
      const resizedImage = await
        sharp(req.file.buffer)
          .resize({
            width: 400,
            height: 400,
            kernel: sharp.kernel.nearest,
            fit: 'contain',
          })
          .toBuffer();

      // creating file info
      fileInfo = {
        "originalName": req.file.originalname,
        "size": req.file.size,
        "b64": getStream(req.file.buffer),
        "b64Length": req.file.buffer.length,
      };

      // get the size of the file 
      let sizeInMb = bytesToMb(req.file.size);

      // if the file is more than expected size
      if (sizeInMb > maxFileSizeInMbFromConfig) {
        error('File Size is More than the given size!');
        return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.fileHandler.fileSizeIsExceeding(maxFileSizeInMbFromConfig));
      }

      // check the max image size 
      let ext = mime.extension(req.file.mimetype);

      //if the extension is not valid 
      if (validExt.indexOf(ext) >= 0) {

        // get the encrypted file 
        req.body.fileInfo = fileInfo;

        // else return response 
      } else return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.fileHandler.fileExtensionIsNotValid(validExt));

    } else 
    // req.body.fileInfo = fileInfo;
    console.log("working !!");

    // move on
    return next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
