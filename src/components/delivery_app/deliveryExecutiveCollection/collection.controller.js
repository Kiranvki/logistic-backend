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
      req.body.unUtilizedAmount=req.body.collectionAmount

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

  mapInvoicesToCollection = async (req, res) => {
    try {

      let collectionsDoneAgainstOneInvoice;
      let totalMappedAmount=0

      for (let i in req.body.invoicesMapped) {
        let projection = {
          "invoiceDetails.invoiceNo":
            req.body.invoicesMapped[i].invoiceNo,
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

          totalMappedAmount=totalMappedAmount+req.body.invoicesMapped[i].mappedAmount

          collectionsDoneAgainstOneInvoice =
            await collectionQuery.totalcollectionsAgainstOneInvoice(
              getInvoice.invoiceDetails.invoiceNo
            );
          let totalCollection
          if (collectionsDoneAgainstOneInvoice.length && collectionsDoneAgainstOneInvoice[0].totalCollection != 0) {
            totalCollection = collectionsDoneAgainstOneInvoice[0].totalCollection + req.body.invoicesMapped[i].mappedAmount
            req.body.unUtilizedAmount = req.body.collectionAmount - totalMappedAmount
          } else { totalCollection = req.body.collectionAmount }

          req.body.invoicesMapped[i].pendingAmount =
            getInvoice.totalNetValue - totalCollection

          if (req.body.invoicesMapped[i].pendingAmount >= 0) {

            if (req.body.collectionAmount == req.body.invoicesMapped[i].totalNetValue) {
              req.body.invoicesMapped[i].invoiceState = "fulfilled"
            }

            if (req.body.collectionAmount < req.body.invoicesMapped[i].totalNetValue) {
              req.body.invoicesMapped[i].invoiceState = "partial"
            }

            if (req.body.collectionStatus && req.body.collectionStatus == "complete") {
              req.body.overallCollectionStatus = "complete";

              await collectionQuery.mapInvoicesToCollection(req.body.collectionId, req.body)
              await collectionQuery.updatePendingAmountInCollections(req.body.soId, req.body.invoicesMapped[i].invoiceNo, req.body.invoicesMapped[i].pendingAmount, "complete")
            } else {
              req.body.overallCollectionStatus = "partial";
              await collectionQuery.mapInvoicesToCollection(req.body.collectionId, req.body)

              await collectionQuery.updatePendingAmountInCollections(req.body.soId, req.body.invoicesMapped[i].invoiceNo, req.body.invoicesMapped[i].pendingAmount, "partial")
            }
          }
        }
      }

      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        {totalMappedAmount},
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
      let searchText=req.query.searchText
      let searchQuery={"invoiceDetails.sold_to_party":soldToParty}
      if (searchText){
        searchQuery["invoiceDetails.invoiceNo"]={$regex:searchText,$options:"i"}
      }
      let sortOn = {}
      sortOn[sortBy] = sortingOrder
      let data = {
        commitedInvoices:[],
        availableInvoices:[]
      }
      let invoiceList = await collectionQuery.getInvoiceListByCustomer(searchQuery, sortOn);
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