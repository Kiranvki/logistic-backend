const mongoose = require("mongoose");

let deCollectionHistorySchema = mongoose.Schema({
    invoice_id: {
        type: mongoose.Types.ObjectId,
    },
    invoice_date: {
        type: Date,
    },
    totalAmount: Number,
    sold_to_party:String,
    outstandingAmount: Number,
    collectionHistory: {
        id: {
            type: mongoose.Types.ObjectId,
        },
        amount: {
            type: Number,
        },
        date: Date,
    },
});

let deCollectionHistoryModel = mongoose.model("deCollectionHistory", deCollectionHistorySchema);
module.exports = deCollectionHistoryModel;
