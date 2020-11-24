module.exports = {
  beatPlanStillNotAssigned: 'Beat Plan Still Not Assigned for today, Please check with the admin team !',
  userDetailsFetchedSuccessfully: 'User Details Fetched Successfully !',
  userNotFound: 'User Not Found !',
  salesmanNotCheckedIn: 'User Needs to Check In inorder to get the details !',
  invalidSalesmanId: 'Invalid Salesman / Beat Plan / Customer Id !',
  invalidCustomerId: 'Customer Not Found !',
  customerDetailsFetchedSuccessfully: 'Customer Details Fetched Successfully !',
  configFetchedSuccessfully: 'Configurable Values Fetched !',
  customerNotCheckedIn: 'Error in Check-in Customer, Please try again after sometime  !',
  customerCheckedInSuccessfully: 'Customer Checked In Successfully !',
  customerNotCheckedOut: 'Error in Check-out Customer, Please try again after sometime  !',
  customerCheckedOutSuccessfully: 'Customer Checked Out Successfully !',
  customerNeedsToCheckOutFirst: 'Customer Needs to Check-out First !',
  customerAlreadyCheckedOut: 'Customer Already Checked-out or still not Checked-in!',
  customerStillNotCheckedIn: 'Customer Needs to Check-in first !',
  customerStillNotCheckedOut: (customers) => {
    return `Customers ${customers} , still not checked out !`;
  },
}