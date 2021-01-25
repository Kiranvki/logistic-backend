// Controller
const request = require('../../../utils/request');

// Responses & others utils 
const {
  error,
  info
} = require('../../../utils').logging;

// exporting the hooks 
module.exports = async (data) => {
  try {
    info(`Hitting the recievables server to store salesman details!`);

    // getting the data from the env
    let recBaseUrl = process.env.recBaseUrl;
    let postSalesman = process.env.recRegisterSalesman;

    let url = recBaseUrl + postSalesman;

    console.log('Hitting REC server for updating the salesman *> ', url);

    // check whether the document type already exist or not 
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
          info('Salesman Registered Successfully !');
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
