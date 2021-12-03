const masterInvoicesModel = require("../../../picker_app/invoice_master/models/invoice_master.model");
const deCollectionHistoryModel = require("./commitments.model");
const deCollectionModel = require("./deliveryExecutiveCollection.model"),
      commitmentModel=require("./commitments.model"),
      mongoose = require("mongoose")


class CollectionQuery {
  async createNewCollection(object) {
    console.log("object",object);
    return await deCollectionModel.create(object);
  }

  async mapInvoicesToCollection(collectionId,object){
    return await deCollectionModel.updateOne({_id:mongoose.Types.ObjectId(collectionId)},{$set:object})
  }

  async getInvoices(projection, sortBy) {
    return await masterInvoicesModel.find(projection).sort(sortBy);
  }

  async updatePendingAmountInCollections(soId,invoiceNo,pendingAmount,overallCollectionStatus){
    if (overallCollectionStatus){
      return await deCollectionModel.updateMany({soId:soId,invoicesMapped:{ $elemMatch: {'invoiceNo':invoiceNo}}},{$set:{"invoicesMapped.$.pendingAmount":pendingAmount,"overallCollectionStatus":overallCollectionStatus}},{upsert:true})
    }else{
      return await deCollectionModel.updateMany({soId:soId,invoicesMapped:{ $elemMatch: {'invoiceNo':invoiceNo}}},{$set:{"invoicesMapped.$.pendingAmount":pendingAmount}},{upsert:true})
    }
  }

  async calculatePendingAmount(invoiceNo){
    let result=await deCollectionModel.aggregate([ { '$match': { 'invoicesMapped.invoiceNo': invoiceNo } }, { '$group': { _id: '', totalCollection: { '$sum': '$collectionAmount' },"pendingAmount":{"$first":"$invoicesMapped.pendingAmount"}}}])
    return result.length?result[0].pendingAmount[0]:0
  }


  //   // mark collection made on the given invoice and reduce the amount
  //   async markCollectionMade(invoiceNo, collectionId, amountPaid, invoice_id) {
  //     try {
  //       console.log("Updating the Pending Amount for the Invoice !");

  //       // get invoice details
  //       let getInvoiceDetails = await masterInvoicesModel.findOne({_id: invoice_Id });

  //       // updating the invoice
  //       if (getInvoiceDetails.outstanding >= amountPaid) {
  //         // get the new amount remaining
  //         let newAmountRemaining = getInvoiceDetails.outstanding - amountPaid;
  //         let collectionInsertArray = {
  //           id: collectionId,
  //           amount: amountPaid,
  //           dateOfCollection: new Date(),
  //         };

  //         // updating the collection model
  //         await masterInvoicesModel
  //           .findByIdAndUpdate(mongoose.Types.ObjectId(invoice_id), {
  //             $set: {
  //               amountRemaining: newAmountRemaining,
  //             },
  //             $push: {
  //               collectionsDone: collectionInsertArray,
  //             },
  //           })
  //           .then((res) => {
  //             if (res)
  //               return {
  //                 success: true,
  //                 data: res,
  //               };
  //             else
  //               return {
  //                 success: false,
  //                 data: [],
  //               };
  //           });
  //       } else {
  //         console.log(
  //           "getInvoiceDetails.amountRemaining >= amountPaid failed",
  //           invoiceId,
  //           collectionId,
  //           amountPaid
  //         );
  //       }

  //       // catch any internal server error
  //     } catch (err) {
  //       console.log(err);
  //       return {
  //         success: false,
  //         data: [],
  //         error: err,
  //       };
  //     }
  //   }

  async totalcollectionsAgainstOneInvoice(invoiceNo) {
    let result
    result= await deCollectionModel.aggregate([
      { $match: { "invoicesMapped.invoiceNo": invoiceNo } },
      {$group: {
        _id: '',
        totalCollection:{ $sum: '$collectionAmount' }
        }}
        // ,{"$project": { totalCollection: "$totalCollection" } }
    ])
    return result.length?result:[{totalCollection:0}];
  }

  // async markCollectionMade({ collectionId, collectionDate, collectionAmount, invoiceNo, totalNetAmount, invoiceId, invoiceDate, sold_to_party }) {
  //   try {
  //     console.log("Updating the Outstanding Amount for the Invoice !",collectionId, collectionDate, collectionAmount, invoiceNo, totalNetAmount, invoiceId, invoiceDate, sold_to_party );
      
  //     // updating the invoice
  //     if (totalNetAmount >= collectionAmount) {
  //       // get the new amount remaining
  //       let newAmountRemaining = totalNetAmount - collectionAmount;

  //       let collectionInsertArray = {
  //         id: collectionId,
  //         amount: collectionAmount,
  //         date: collectionDate,
  //       };

  //       // updating the collectionHistory model
  //       await deCollectionHistoryModel
  //         .findOneAndUpdate(
  //           { invoiceId: mongoose.Types.ObjectId(invoiceid) },
  //           {
  //             $set: {
  //               invoiceNo: invoiceNo,
  //               invoiceId: invoiceId,
  //               totalNetAmount: totalNetAmount,
  //               invoiceDate: invoiceDate,
  //               sold_to_party:sold_to_party,
  //               outstandingAmount: newAmountRemaining,
  //             },
  //             $push: {
  //               collectionsDone: collectionInsertArray,
  //             },
  //           }
  //         )
  //         .then((res) => {
  //           if (res)
  //             return {
  //               success: true,
  //               data: res,
  //             };
  //           else
  //             return {
  //               success: false,
  //               data: [],
  //             };
  //         });
  //     } 

  //     // catch any internal server error
  //   } catch (err) {
  //     console.log(err);
  //     return {
  //       success: false,
  //       data: [],
  //       error: err,
  //     };
  //   }
  // }

  async getCollectionHistoryByCustomer(soldToParty) {
    return await deCollectionHistoryModel.find({
      sold_to_party: soldToParty,
    });
  }

  
  async getInvoiceList(projection,sort) {
    return await masterInvoicesModel.find(projection).sort(sort);
  }



  async getInvoiceListByCustomer(searchQuery,sortOn) {
    return await masterInvoicesModel.aggregate([{$match:{...searchQuery}},{$sort:sortOn}]);
  }

  async getCommittedInvoice(soldToParty){
    return await commitmentModel.aggregate(
      [
          {
              $match:{
                  goFrugalId:Number(soldToParty),
                  isDeleted:0,
                  status:1
                  
              }
              
          },
          {$project:{
              _id:1,
              salesmanId:1,
              customerId:1,
              commitmentDate : 1,
              commitmentDateTime : 1,
              totalCommitmentAmount : 1,
          }},
          {$lookup: {
              
                 from: "commitmentinvoicemappings",
                 let: { id:"$_id"},
                 pipeline: [
                     { $match:
                        { $expr:
                        {$eq:["$commitmentId","$$id"]}                     }
                     },
                     {
                         $lookup: {
                                from: "invoicemasters",
                                localField: "invoiceId",
                                foreignField: "_id",
                                as: "invoices"
                              }
                     }
                     ],
                as: "result"
          }},
          {$project:{"invoice":{$first:"$result.invoices"},
            "salesmanId":"$salesmanId",
              "customerId":"$customerId",
              "commitmentDate" : "$commitmentDate",
              "commitmentDateTime" : "$commitmentDateTime",
              "totalCommitmentAmount" : "$totalCommitmentAmount"
              
          }},
            //   {
            //   $group:{
                  
            //     "_id": "$committedInvoices._id",
            //     "invoiceNo":{$first:"$invoice.invoiceNo"},
            //     "invoiceDate":{$first:"$invoice.invoiceDate"},
            //     "sapID":{$first:"$invoice.sapID"},
            //     "billing_type":{$first:"$invoice.billing_type"},
            //     "sales_Org":{$first:"$invoice.sales_Org"},
            //     "distribution_channel":{$first:"$invoice.distribution_channel"},
            //     "division":{$first:"$invoice.division"},
            //     "customer_price_group":{$first:"$invoice.customer_price_group"},
            //     "customer_group":{$first:"$invoice.customer_group"},
            //     "inco_terms":{$first:"$invoice.inco_terms"},
            //     "company_code":{$first:"$invoice.company_code"},
            //     "account_assignment_group":{$first:"$invoice.account_assignment_group"},
            //     "sold_to_party":{$first:"$invoice.sold_to_party"},
            //     "bill_to_party":{$first:"$invoice.bill_to_party"},
            //     "pendingAmount":{$first:"$invoice.pendingAmount"},
            //     "totalAmount":{$first:"$invoice.totalAmount"},
            //     "createdAt":{$first:"$invoice.createdAt"},
            //     "updatedAt":{$first:"$invoice.updatedAt"},
            //      "salesmanId":{$first:"$salesmanId"},
            //   "customerId":{$first:"$customerId"},
            //   "commitmentDate" : {$first:"$commitmentDate"},
            //   "commitmentDateTime" : {$first:"$commitmentDateTime"},
            //   "totalCommitmentAmount" : {$sum:"$totalCommitmentAmount"},

            //   }
        //   }
          ])
  }
}

module.exports = new CollectionQuery();