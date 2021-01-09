// Responses & others utils 
const moment = require('moment');
const Response = require('../responses/response');
const StatusCodes = require('../facades/response');
const MessageTypes = require('../responses/types');
const Exceptions = require('../exceptions/Handler');
const {
  error,
  info
} = require('../utils').logging;
const {
  getEmployeeDataUsingColumn
} = require('../third_party_api/zoho');

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {

    info('Get the user details from Zoho !');

    // get the email id 
    let empId = req.query.empId || req.body.empId,
      getUserDetails = '';

    // check whether the document type already exist or not 
    if (empId) {
      getUserDetails = await getEmployeeDataUsingColumn(empId);
      // check whether the document type already exists
      if (getUserDetails.success) {
        info('Zoho data Retrieved'); // user doesnt exist 

        // zoho key array
        let zohoKeyArray = Object.keys(getUserDetails.data[0]);
        let zohoId = zohoKeyArray[0];
        let zohoData = getUserDetails.data[0][zohoId][0] || {};

        // initialising user data
        let userData = {
          employeeId: zohoData.EmployeeID,
          email: zohoData.EmailID,
          gender: zohoData.Gender,
          aadharNumber: zohoData.Aadhar_ID,
          zohoId: zohoData.Zoho_ID,
          designation: zohoData.Designation,
          pan: zohoData.PAN,
          firstName: zohoData.FirstName,
          lastName: zohoData.LastName,
          contactMobile: zohoData.Mobile,
          photo: zohoData.Photo_downloadUrl,
          role: zohoData.Role,
          employeeStatus: zohoData.Employeestatus,
          employeeType: zohoData.Employee_type,
          locationName: zohoData.LocationName,
          dateOfJoining: new Date(moment(zohoData.Dateofjoining, 'DD-MMM-YYYY').format('MM-DD-YYYY')),
          reportingTo: {
            id: zohoData['Reporting_To.ID'],
            name: zohoData.Reporting_To,
            emailId: zohoData['Reporting_To.MailID'],
          }
        };

        // user data 
        req.body.userData = userData;
        // check whether the password matches
        if (req.body.userData) {
          info('User Details Found !');
          next();
        } else return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.zohoServerError);
      } else return Response.errors(req, res, StatusCodes.HTTP_CONFLICT, MessageTypes.employee.zohoServerError);
    } else next();

    // catch any runtime error 
  } catch (e) {
    error(e);
    return Response.errors(req, res, StatusCodes.HTTP_INTERNAL_SERVER_ERROR, Exceptions.internalServerErr(req, e));
  }
};
