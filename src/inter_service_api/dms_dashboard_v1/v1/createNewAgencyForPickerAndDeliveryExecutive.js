// Controller
const request = require('../../../utils/request');

// Responses & others utils 
const {
  error,
  info
} = require('../../../utils').logging;

// exporting the hooks 
module.exports = async (agencyName, cityId) => {
  try {
    info(`Hitting the DMS V1 server to create a new agency for the delivery and pickerboy!`);
    console.log('agencyName', agencyName);
    console.log('cityId', cityId);

    // getting the data from the env
    let dmsV1BaseUrl = process.env.dmsV1BaseUrl;
    let createNewAgencyForPickerAndDelivery = process.env.createNewAgencyForPickerAndDelivery + cityId;

    let url = dmsV1BaseUrl + createNewAgencyForPickerAndDelivery; // DMS url
    console.log('url', url);

    // check whether the document type already exist or not 
    return request.post(url)
      .timeout({
        response: 5000, // Wait 10 seconds for the server to start sending,
        deadline: 5000, // but allow 1 minute for the file to finish loading.
      })
      .send({ 'name': agencyName })
      .retry(1)
      .then((res) => {
        // checking whether the user is authentic
        if (res.status === 200) {
          console.log('res', res);

          info('Agency Created Successfully !');
          return {
            success: true,
            data: res.body.data,
          };
        } else {
          return {
            success: false
          };
        }
        // catch any runtime error
      }, (err) => {
        // error(err);
        if (err.timeout) {
          return {
            success: false,
            error: 'API timeout'
          };
        } else {
          return {
            success: false,
            error: err
          };
        }
      });

    // catch any runtime error 
  } catch (e) {
    error(e);
    return {
      success: false,
      error: e
    };
  }
};