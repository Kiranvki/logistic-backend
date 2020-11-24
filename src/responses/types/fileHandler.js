module.exports = {
  fileSizeIsExceeding: (maxSize) => {
    return `File Uploaded is more than the permitted size of ${maxSize} MB.`
  },
  unableToEncrypt: 'Internal Server Error! Please try after sometime !',
  fileExtensionIsNotValid: (validExt) => {
    return `File Uploaded should be one of the following ${validExt}`;
  },
  fileSuccessfullyUploaded: 'File Successfully uploaded',
  pleaseSelectAFileToUpload: 'Please select a file to upload!',
  fileNotFound: 'File Not Found !'
};