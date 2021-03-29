// Controller
const request = require('../../../utils/request');

// Responses & others utils 
const {
  error,
  info
} = require('../../../utils').logging;

// exporting the hooks 
module.exports = async (req,res,next) => {
  try {
    info(`Hitting the SAP for Picking Allocation !`);
    let data = req.body.data;
    // getting the data from the env
    let sapBaseUrl = 'http://52.172.31.130:50100/RESTAdapter/';
    

    let url = sapBaseUrl + 'waycool/Picking_Allocation_Creation';

    console.log('Hitting SAP server for Generating the delivery Number *> ', url);

    // get the data from SAP
    return request.post(url)
      .send(data)
      .timeout({
        response: 5000, // Wait 10 seconds for the server to start sending,
        deadline: 5000, // but allow 1 minute for the file to finish loading.
      })
      .retry(1)
      .then((res) => {
        // checking whether the user is authentic
        if (res.status === 201) {
          info('Document Generated Successfully !');
          return {
            success: true,
            data: res.body.data,
          };
        } else {
          error('Error Updating Server !');
          return {
            success: false
          };
        }
        // catch any runtime error
      }, (err) => {
        error(err);
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
