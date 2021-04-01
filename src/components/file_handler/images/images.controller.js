const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
// getting the model 
const Model = require('./models/images.model');
const {
  error,
  info
} = require('../../../utils').logging;
const _ = require('lodash');
const stream = require('stream');

// image controller 
class fileImagesController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.fileHandler;
  }

  // upload image to the database 
  uploadImage = async (req, res) => {
    try {
      info('Uploading the Image to the DB !');

      // creating a insert object 
      let insertObject = {
        encryptedFile: req.body.fileInfo.encrypted,
        encryptedFileThumb: req.body.fileInfo.thumbnailEnc,
        createdBy: req.user._id
      }

      // inserting into the db 
      let imageId = await Model.create(insertObject);

      // success 
      return this.success(req, res, this.status.HTTP_OK, { imageId: imageId._id }, this.messageTypes.fileSuccessfullyUploaded);

      // catch any runtime error 
    } catch (err) {
      error(err);
      return this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  // get the file 
  getFile = (fileId) => {
    try {
      info('Get the file !');

      // creating the data inside the database 
      return Model.findById(fileId).lean().then((res) => {
        if (res && !_.isEmpty(res))
          return {
            success: true,
            data: res
          };
        else return {
          success: false
        }
      });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // download an image 
  downloadImage = async (req, res) => {
    try {
      info('Triggering Downloading the Image!');

      let readStream = new stream.PassThrough();

      readStream.end(req.body.decrypted);
      readStream.pipe(res);

      // catch any runtime error 
    } catch (err) {
      error(err);
      return this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

}

// exporting the modules 
module.exports = new fileImagesController();
