// external controllers
const BasicCtrl = require('../components/basic_config/basic_config.controller');

// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const mime = require('mime-types');

// crypto 
const crypto = require('crypto');
const _ = require('lodash');
const sharp = require('sharp');
const {
  error,
  info
} = require('../utils').logging;

// getting the values from the env files 
const ENC_KEY = process.env.ENC_KEY;
const IV = process.env.IV || '5183666c72eec9e4';

// encrypt images 
const encrypt = ((val) => {
  info('Encrpting the Image!');
  let cipher = crypto.createCipheriv('aes-256-cbc', ENC_KEY, IV);
  let encrypted = cipher.update(val, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
});

// converting file size to mb
const bytesToMb = (bytes) => {
  if (bytes == 0) return 0;
  return (bytes / Math.pow(10, 6)).toFixed(1);
}

// maximum file to upload
const validExt = process.env.validImageMimeTypes || [];

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    info('Uploading the file to server !');
    const maxFileSizeInMbFromConfig = await BasicCtrl.GET_MAX_STOP_IMAGE_FILE_SIZE_IN_MB().then((res) => { if (res.success) return res.data; else return 1; });

    // checking if the file is there
    if (req.file) {

      // creating a new file info
      const resizedImage = await
        sharp(req.file.buffer)
          .resize({
            width: 400,
            height: 400,
            kernel: sharp.kernel.nearest,
            fit: 'contain',
          })
          .toBuffer();

      let fileInfo = {
        "originalName": req.file.originalName,
        "size": req.file.size,
        "b64": new Buffer(req.file.buffer).toString("base64"),
        "thumbnailb64": new Buffer(resizedImage).toString("base64"),
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

      // if the extension is not valid 
      if (validExt.indexOf(ext) >= 0) {

        // encrypting the image
        let encryptedFile = encrypt(fileInfo.b64);
        fileInfo.encrypted = encryptedFile;

        // encrypting the thumbnail
        let encryptedThumb = encrypt(fileInfo.thumbnailb64);
        fileInfo.thumbnailEnc = encryptedThumb;

        // get the encrypted file 
        if (!_.isEmpty(fileInfo.encrypted)) {
          req.body.fileInfo = fileInfo;
          next();
        }
        else {
          error('Unable to encrypt the image!');
          return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.fileHandler.unableToEncrypt);
        }
      } else return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.fileHandler.fileExtensionIsNotValid(validExt));

    } else {
      error('Unable to encrypt the image!');
      return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.fileHandler.pleaseSelectAFileToUpload);
    }
    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
