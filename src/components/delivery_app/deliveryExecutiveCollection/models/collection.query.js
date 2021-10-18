const masterInvoicesModel = require("../../../picker_app/invoice_master/models/invoice_master.model");
const deCollectionHistoryModel = require("./deCollectionHistory.model");
const deCollectionModel = require("./deliveryExecutiveCollection.model");

class CollectionQuery {
  async createNewCollection(object) {
    console.log("object",object);
    return await deCollectionModel.create(object);
  }

  async getInvoices(projection, sortBy) {
    return await masterInvoicesModel.find(projection).sort(sortBy);
  }

  async updatePendingAmountInCollections(soId,invoiceNo,pendingAmount){
    console.log("here>>>>>>>>>>>>");
    return await deCollectionModel.updateMany({soId:soId,invoicesMapped:{ $elemMatch: {'invoiceNo':invoiceNo}}},{$set:{"invoicesMapped.$.pendingAmount":pendingAmount}},{upsert:true})
  }

  async calculatePendingAmount(invoiceNo){
    let result=await deCollectionModel.aggregate([ { '$match': { 'invoicesMapped.invoiceNo': invoiceNo } }, { '$group': { _id: '', totalCollection: { '$sum': '$collectionAmount' },"pendingAmount":{"$first":"$invoicesMapped.pendingAmount"}}}])
    return result.length?result[0].pendingAmount:[]
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



  async getInvoiceListByCustomer(soldToParty,sortOn) {
    return await masterInvoicesModel.find({
      "invoiceDetails.sold_to_party": soldToParty,
    }).sort(sortOn);
  }
}

module.exports = new CollectionQuery();
