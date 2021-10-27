const BaseController = require("../../baseController");
const { error } = require("../../../utils").logging;
const collectionQuery = require("./models/collection.query");
const { result } = require("lodash");
const mongoose = require("mongoose");
const {
  getCustomerDetails
} = require('../../../inter_service_api/dms_dashboard_v1/v1')

class NewCollection extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.deliveryExecutive;
  }

  //to create a new record of a new collection
  createNewCollection = async (req, res) => {
    try {

      req.body.customer = {
        sold_to_party: req.body.soldToParty,
        sold_to_party_description: req.body.sold_to_party_description,
      };

      // req.body.DEEmployeeId = req.userDetails.employeeId;
      
      req.body.sold_to_party = req.body.soldToParty;
      req.body.collectionDoneBy = "waycool";
      // req.body.DEName = req.userDetails.name;
      req.body.isInvoiceMapped = false;
      req.body.isCollectionMade = true;
      req.body.collectionDone = true;

      let DEDetails = {
        // id: mongoose.Types.ObjectId(req.user._id),
        // employeeId: req.userDetails.employeeId,
        // name: req.userDetails.name,
      };

      if (req.body.type === "cash") {
        // req.body.cash = req.body.cash;
        if (
          !req.body.cash.denominations ||
          !req.body.cash.denominations.length
        ) {
          this.errors(req, res, 400, "denominations are required");
          return;
        }
        req.body.cash.DEDetails = DEDetails;
        req.body.cash.status = "approved";
      }

      if (req.body.type === "cheque") {
        for (let v of req.body.cheque) {
          v.status = "approved";
          v.stage=[{
            "state" : "handed over to DE",
            "date" : new Date()
          }]
        }
        req.body.cheque.DEDetails = DEDetails;
      }

      if (req.body.type === "demandDraft") {
        req.body.demandDraft.DEDetails = DEDetails;

        for (let v of req.body.demandDraft) {
          v.status = "approved";
          v.stage=[{
            "state" : "handed over to DE",
            "date" : new Date()
          }]
        }
      }

      if (req.body.type === "online") {
        req.body.online.DEDetails = DEDetails;

        for (let v of req.body.online) {
          v.status = "approved";
        }
      }
      if (!req.body.stage) {
        req.body.stage = { state: "handed over to DE", date: new Date() };
      }


      let result=await collectionQuery.createNewCollection(req.body);
    console.log("result>>>>>>>>>",result)
    
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {collectionId:result._id||""},
        "Collection Created"
      );
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        "Internal Server Error",
      );
    }

    // success(req, res, status, data = null, message = 'success')
  };

  mapInvoicesToCollection=async(req,res)=>{
    try{

    let collectionsDoneAgainstOneInvoice;

    for (let i in req.body.invoicesMapped) {
      let projection = {
        "invoiceDetails.invoiceNo":
          req.body.invoicesMapped[i].invoiceDetails.invoiceNo,
        soId: req.body.soId,
      };
      let sort = req.body.sort
      let getInvoice = await collectionQuery.getInvoiceList(projection, sort)
      getInvoice = getInvoice[0];
      if (req.body.invoicesMapped[i]["partialMapping"] == false) {
        req.body.invoicesMapped[i].invoiceState = "fulfilled";
      }

      if (req.body.invoicesMapped[i]["partialMapping"] == true) {
        req.body.invoicesMapped[i].invoiceState = "partial";
      }
      if (getInvoice) {
        req.body.invoicesMapped[i].sold_to_party =
          getInvoice.invoiceDetails.sold_to_party;
        req.body.invoicesMapped[i].invoiceId = mongoose.Types.ObjectId(getInvoice._id);
        req.body.invoicesMapped[i].invoiceNo =
          getInvoice.invoiceDetails.invoiceNo;

        req.body.invoicesMapped[i].totalNetValue = getInvoice.totalNetValue;
        req.body.invoicesMapped[i].location = getInvoice.location;
        req.body.invoicesMapped[i].invoiceDate = getInvoice.invoiceDate;

        collectionsDoneAgainstOneInvoice =
          await collectionQuery.totalcollectionsAgainstOneInvoice(
            getInvoice.invoiceDetails.invoiceNo
          );
        let totalCollection
        if (collectionsDoneAgainstOneInvoice.length && collectionsDoneAgainstOneInvoice[0].totalCollection != 0) {
          totalCollection = collectionsDoneAgainstOneInvoice[0].totalCollection + req.body.collectionAmount
        } else { totalCollection = req.body.collectionAmount }

        req.body.invoicesMapped[i].pendingAmount =
          getInvoice.totalNetValue - totalCollection

        if(req.body.invoicesMapped[i].pendingAmount>=0){  

        if (req.body.collectionAmount == req.body.invoicesMapped[i].totalNetValue) {
          req.body.invoicesMapped[i].invoiceState = "fulfilled"
        }

        if (req.body.collectionAmount < req.body.invoicesMapped[i].totalNetValue) {
          req.body.invoicesMapped[i].invoiceState = "partial"
        }

        if (req.body.collectionStatus && req.body.collectionStatus=="complete"){
          req.body.overallCollectionStatus = "complete";

            await collectionQuery.updatePendingAmountInCollections(req.body.soId, req.body.invoicesMapped[i].invoiceNo, req.body.invoicesMapped[i].pendingAmount,"complete")
          }else{
            req.body.overallCollectionStatus = "partial";

            await collectionQuery.updatePendingAmountInCollections(req.body.soId, req.body.invoicesMapped[i].invoiceNo, req.body.invoicesMapped[i].pendingAmount,"partial")
          }
      }
    }
  }


  return this.success(
    req,
    res,
    this.status.HTTP_OK,
    {},
    "invoices mapped to collection"
  );
} catch (err) {
  error(err);
  this.errors(
    req,
    res,
    this.status.HTTP_INTERNAL_SERVER_ERROR,
    "Internal Server Error",
  );
}

  }

  //function to fetch all the invoices against a customer
  getInvoiceListByCustomer = async (req, res) => {
    try {
      let soldToParty = req.query.soldToParty;
      let sortBy = req.query.sortBy
      let sortingOrder = req.query.sortingOrder
      let sortOn = {}
      sortOn[sortBy] = sortingOrder
      let data = {
        commitedInvoices:[],
        availableInvoices:[]
      }
      let invoiceList = await collectionQuery.getInvoiceListByCustomer(soldToParty, sortOn);
      if (sortBy == "amount") {
        sortBy = totalNetValue;
      }
      
      // let customerDataFromMicroService = await getCustomerDetails(soldToParty);
      // let gofrugalId=customerDataFromMicroService.data.gofrugalId
      
      if (invoiceList.length) {
        for (let i in invoiceList) {
          let commitedInvoices=await collectionQuery.getCommittedInvoice(Number(soldToParty))
          let totalNetValue = invoiceList[i].totalNetValue
          let totalPendingAmount = await collectionQuery.calculatePendingAmount(invoiceList[i].invoiceDetails.invoiceNo)
          let pendingAmount = totalPendingAmount ? totalPendingAmount : totalNetValue
          let count=0
          for (let j in commitedInvoices){
            if (commitedInvoices[j].invoice && commitedInvoices[j].invoice.length && commitedInvoices[j].invoice[0].invoiceDetails && invoiceList[i].invoiceDetails.invoiceNo==commitedInvoices[j].invoice[0].invoiceDetails.invoiceNo){
              data["commitedInvoices"].push({_id:mongoose.Types.ObjectId(invoiceList[i]._id),
                ...invoiceList[i].invoiceDetails,
                'pendingAmount': pendingAmount,
                "totalAmount": totalNetValue,
                createdAt:invoiceList[i].createdAt,
                updatedAt:invoiceList[i].updatedAt,})
                count++;
            }
          }
            if (!count){
              data["availableInvoices"].push({
                _id:mongoose.Types.ObjectId(invoiceList[i]._id),
                ...invoiceList[i].invoiceDetails,
                'pendingAmount': pendingAmount,
                "totalAmount": totalNetValue,
                createdAt:invoiceList[i].createdAt,
                updatedAt:invoiceList[i].updatedAt,
                
              })
            }

          
        }


      }
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        data,
        "invoices fetched"
      );
    } catch (err) {
      error(err);
      this.errors(
        req,
        res,
        this.status.HTTP_INTERNAL_SERVER_ERROR,
        "Internal Server Error",
      );
    }
  }
}

module.exports = new NewCollection();

// {
//   success: true,
//   data: {
//     _id: '6034d1f804e1837a23ae2389',
//     cityId: '',
//     goFrugalId: 1039285,
//     __v: 0,
//     aadharNumber: ' ',
//     address1: '314, 28th Main Rd, Sector 2, 1st Sector, HSR Layout',
//     address2: '#',
//     address3: '#',
//     allowBilling: 1,
//     area: '0',
//     birthdate: '',
//     city: 'Bengaluru',
//     country: 'IN',
//     createdAt: '2021-02-23T09:59:20.780Z',
//     creditDays: 0,
//     creditDaysLeft: 7,
//     creditLimit: '50.56',
//     customerAlias: 0,
//     customerId: '',
//     customerTypeCode: null,
//     dbStatus: 1,
//     email: ' ',
//     gstNumber: ' ',
//     gstRegType: 0,
//     isCreditAllowed: 1,
//     isDeleted: 0,
//     isFree: 0,
//     isGstExempted: false,
//     isOffer: 0,
//     isQty: 1,
//     latitude: '12.9180572',
//     location: { type: 'Point', coordinates: [Array] },
//     loginId: '',
//     longitude: '77.6523404',
//     marriageDate: null,
//     mobile: '9731913185',
//     name: 'BANGALORE HORTICULTURE HSR',
//     outstanding: '0',
//     panNumber: ' ',
//     phone1: '9731913185',
//     phone2: '',
//     phone3: '',
//     pincode: '560102',
//     priceLevelId: 'FG',
//     salesMan: ' ',
//     salesManCode: 0,
//     salesManMobile: '',
//     state: '29',
//     stateCode: '29',
//     status: '1',
//     syncTS: 0,
//     type: 'ZWDO',
//     updatedAt: '2021-04-03T07:01:19.163Z',
//     isMigrated: 1,
//     account_assignment_group: null,
//     bp_role: '2',
//     building_code: 43,
//     check_rule: '02',
//     company_code: [ [Object] ],
//     currency: 'INR',
//     customer_group: null,
//     customer_pricing_procedure: null,
//     delivery_plant: null,
//     delivery_priority: null,
//     distribution_channel: '50',
//     grouping: 'ZWDO',
//     inco_terms: null,
//     inco_terms_location: null,
//     language: 'E',
//     legacy: 3666,
//     order_combination: null,
//     output_tax_jocg: null,
//     output_tax_joig: null,
//     output_tax_josg: null,
//     output_tax_joug: null,
//     output_tax_yces: null,
//     payment_terms: null,
//     price_group: null,
//     price_list: null,
//     reconciliation_account: null,
//     route: '',
//     sales_area: [
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object], [Object], [Object], [Object],
//       [Object], [Object]
//     ],
//     sales_district: null,
//     sales_group: null,
//     sales_office: null,
//     sales_organization: '5000',
//     search_term: 'BLR22703',
//     shipping_conditions: null,
//     tax_category: ' ',
//     title: '0003',
//     updated_at: '2021-10-15T19:00:48.256Z',
//     url: '',
//     valid_to: '2021-10-31',
//     sap_customer_no: '0001039285',
//     erp_updated_at: '2021-10-15 10:00:24',
//     beatPlans: [ [Object], [Object], [Object], [Object], [Object] ]
//   }
// }
