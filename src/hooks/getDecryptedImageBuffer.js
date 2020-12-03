// Responses & others utils 
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const {
  error,
  info
} = require('../utils').logging;
const crypto = require('crypto');

// decrypt images 
const decrypt = ((encrypted, ENC_KEY, IV) => {
  let decipher = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, IV);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  return (decrypted + decipher.final('utf8'));
});

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {
    // getting the stop id 
    info(`Get the decrypted data from image table!`);
    let fileType = req.params.fileType || 'file';

    // check whether the body contains the route id or not 
    if (req.body && req.body.file && typeof req.body.file == 'object') {
      let encryptedKey = req.body.file.encryptedKey,
        IV = req.body.file.IV,
        encryptedText = '';

      // actual image 
      if (fileType == 'file') encryptedText = req.body.file.encryptedFile; // fetched data 
      else encryptedText = req.body.file.encryptedFileThumb; // fetched data 

      let decryptedBuffer = decrypt(encryptedText, encryptedKey, IV);
      let imageBuffer = Buffer.from(decryptedBuffer, 'base64');
      req.body.decrypted = imageBuffer;

      // next 
      next();

      // if route id is not present
    } else return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.stopMaster.inValidStop);

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
