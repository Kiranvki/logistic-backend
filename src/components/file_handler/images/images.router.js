// multer for multipart request body
const multer = require('multer');
const multipartMiddleware = multer();

// user controller 
const ctrl = require('./images.controller');

// custom joi validation
const {
  joiValidationForFileDownload, // check whether the params are present
} = require('./images.validators');

// custom hooks
const {
  getDecryptedImageBuffer, // decrypt the image buffer 
  checkWhetherTheFileIdIsValid, // check whether the id is valid image id or not 
  encryptTheFileInorderToStoreItInDb,
} = require('../../../hooks');

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');

// app auth 
const {
  verifyAppToken
} = require('../../..//hooks/app/Auth')

// exporting the user routes 
function imageRoutes() {
  //open, closed
  return (open, closed, appOpen, appClosed) => {
    // closed

    // upload file to server 
    closed.route('/image/upload').post(
      verifyUserToken, // verify user token
      multipartMiddleware.single('image'), // multer middleware
      encryptTheFileInorderToStoreItInDb,
      ctrl.uploadImage
    );

    // download file from server using id 
    open.route('/image/download/:fileType/:fileId').get(
      [joiValidationForFileDownload], // joi validation
      checkWhetherTheFileIdIsValid, // check whether the file id is valid 
      getDecryptedImageBuffer, // get the decrypted base64
      ctrl.downloadImage
    );

    // upload file to server 
    appClosed.route('/image/upload').post(
      verifyAppToken, // verify user token
      multipartMiddleware.single('image'), // multer middleware
      encryptTheFileInorderToStoreItInDb,
      ctrl.uploadImage
    );

    // download image
    appOpen.route('/image/download/:fileType/:fileId').get(
      [joiValidationForFileDownload], // joi validation
      checkWhetherTheFileIdIsValid, // check whether the file id is valid 
      getDecryptedImageBuffer, // get the decrypted base64
      ctrl.downloadImage
    );
  };
}

module.exports = imageRoutes();
