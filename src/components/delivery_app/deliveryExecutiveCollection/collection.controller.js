const BaseController = require("../../baseController");
const { error } = require("../../../utils").logging;
const collectionQuery = require("./models/collection.query");
const { result } = require("lodash");
const mongoose = require("mongoose");

class NewCollection extends BaseController {
  // constructor
  constructor() {
    super();
    this.messageTypes = this.messageTypes.deliveryExecutive;
  }

  //to create a new record of a new collection
  createNewCollection = async (req, res) => {
    try {
      let projection = {};

      req.body.customer = {
        sold_to_party: req.body.soldToParty || 0,
        sold_to_party_description: req.body.customerName || "",
      };


      let collectionsDoneAgainstOneInvoice;

      for (let i in req.body.invoicesMapped) {
        // delete req.body.invoicesMapped[i]._id;

        projection = {
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
        console.log(">>>>>", getInvoice._id);
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
            
            console.log("req.body.invoicesMapped[i].pendingAmount", req.body.invoicesMapped[i].pendingAmount);
            if (req.body.collectionAmount == req.body.invoicesMapped[i].totalNetValue) {
              req.body.invoicesMapped[i].invoiceState = "fulfilled"
            }
            
            if (req.body.collectionAmount < req.body.invoicesMapped[i].totalNetValue) {
              req.body.invoicesMapped[i].invoiceState = "partial"
            }
            
            
            await collectionQuery.updatePendingAmountInCollections(req.body.soId,req.body.invoicesMapped[i].invoiceNo,req.body.invoicesMapped[i].pendingAmount)
            
          }
        }
        
        // req.body.DEEmployeeId = req.userDetails.employeeId;
        req.body.collectionDate = req.body.date;
      req.body.sold_to_party = req.body.soldToParty;
      req.body.collectionDoneBy = "waycool";
      // req.body.DEName = req.userDetails.name;
      req.body.isInvoiceMapped = true;
      req.body.isCollectionMade = true;
      req.body.collectionDone = true;

      let DEDetails = {
        // id: mongoose.Types.ObjectId(req.user._id),
        // employeeId: req.userDetails.employeeId,
        // name: req.userDetails.name,
      };

      // req.body.type = "cash";
      // req.body.cash = [{ denominations: [{ denominationsType: 1, count: 2 }] }];
      // console.log(req.body.cash[0], req.body.type);

      if (req.body.type === "cash") {
        req.body.cash = req.body.cash[0];
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
        }
        req.body.cheque.DEDetails = DEDetails;
      }

      if (req.body.type === "demandDraft") {
        req.body.demandDraft.DEDetails = DEDetails;

        for (let v of req.body.demandDraft) {
          v.status = "approved";
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


      let result = await collectionQuery.createNewCollection(req.body);


      // for (let i = 0; i < req.body.invoicesMapped.length; i++) {
      // let markObject = {
      //   collectionId: result._id,
      //   collectionDate: result.collectionDate,
      //   collectionAmount: result.collectionAmount,
      //   invoiceNo: req.body.invoicesMapped[i].invoiceNo,
      //   totalNetAmount: req.body.invoicesMapped[i].totalNetValue,
      //   invoiceId: req.body.invoicesMapped[i].invoiceId,
      //   invoiceDate: req.body.invoicesMapped[i].invoiceDate,
      //   sold_to_party:req.body.invoicesMapped[i].invoiceDetails.sold_to_party
      // }


      //   await collectionQuery.markCollectionMade(markObject);
      // }

      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        [],
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

  //function to fetch all the invoices against a customer
  getInvoiceListByCustomer= async (req, res)=> {
    try {
      let soldToParty = req.query.soldToParty;
      let sortBy = req.query.sortBy
      let sortingOrder = req.query.sortingOrder
      let sortOn={}
      sortOn[sortBy]= sortingOrder 
      let totalCollection
      let invoiceList = await collectionQuery.getInvoiceListByCustomer(soldToParty, sortOn);
      if (sortBy=="amount"){
        sortBy=totalNetValue;
      }
      if (invoiceList.length) {
        for (let i in invoiceList) {
          totalCollection = await collectionQuery.totalcollectionsAgainstOneInvoice(invoiceList[i].invoiceDetails.invoiceNo)
          totalCollection=totalCollection[0].totalCollection
          let totalNetValue = invoiceList[i].totalNetValue
          let totalPendingAmount = await collectionQuery.calculatePendingAmount(invoiceList[i].invoiceDetails.invoiceNo)
          console.log("totalPendingAmount>>>>>",totalPendingAmount)        
          let pendingAmount=totalPendingAmount.length?totalPendingAmount[0]:totalNetValue
          console.log(invoiceList[i]=Object.create({...invoiceList[i],pendingAmount:pendingAmount}))
      }}
      return this.success(
        req,
        res,
        this.status.HTTP_OK,
        invoiceList,
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
