const mongoose = require("mongoose");
const autoIncrement = require("mongoose-sequence")(mongoose);
const autopopulate = require("mongoose-autopopulate");


let collectionSchema = mongoose.Schema(
  {
    DEEmployeeId: {
      type: String,
    },
    DEName: {
      type: String,
    },
    soId: {
      type: Number,
    },
    isDisputed: {
      type: Boolean,
      default: false,
    },
    disputedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "disputes",
    },
    disputeType: {
      type: String,
      enum: [
        "paymentDispute",
        "collectionDispute",
        "invoiceDispute",
        "debitDispute",
        "creditDispute",
      ], // Add 2 more types
    },
    customer: {
      sold_to_party: {
        type: String,
        required: true,
      },
      sold_to_party_description: {
        type: String,
      },
      type: {
        type: String,
      },
    },

    customerName: {
      //not in use know
      type: String,
    },
    sales_Org: {
      type: String,
    },
    distribution_channel: {
      type: String,
    },
    division: {
      type: Number,
    },
    customerGroup: {
      //not in use know
      type: String,
    },
    customerSubgroup: {
      //not in use know
      type: String,
    },
    creditDays: {
      //not in use know
      type: String,
    },
    location: {
      //not in use know use other key
      type: String,
    },
    collectionAmount: {
      type: Number,
    },
    collectionStatus: {
      type: "String",
      enum: ["pending","partial","complete"],
      default:"pending"
    },
    overallCollectionStatus: {
      type: "String",
      enum: ["pending","partial","complete"],
    },
    isFailed: {
      type: Boolean,
      default: false,
    },
    failedReason: {
      type: String,
    },
    failedComment: {
      type: String,
    },
    // commitmentId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Commitments",
    // },
    // totalCommitmentAmount: {
    //   type: Number,
    // },
    // commitmentDate: {
    //   type: Date,
    // },
    collectionDone: {
      type: Boolean,
      default: false,
    },
    isInvoiceMapped: {
      type: Boolean,
      default: true,
    },
    isCollectionMade: {
      type: Boolean,
      default: true,
    },
    collectionDate: {
      type: Date,
      default: new Date(),
    },
    // collectionDoneBy: {
    //   type: String,
    //   enum: ["waycool", "customer", "deliveryExecutive"],
    //   default: "deliveryExecutive",
    // },
    // mode: [String],
    cash: {
      amount: {
        type: Number,
      },
      denominations: [
        {
          denominationsType: Number,
          count: Number,
        },
      ],
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      comments: String,
      stage: [
        {
          state: {
            type: String,
            default: "pending from customer",
            enum: [
              "credited to account",
              "pending from customer",
              "pending from field executive",
              "handed over to DE",
              "pending for submission",
              "submitted to bank",
              "reflected in account",
              "invoice map confirmation",
              "post to tally",
              "post to SAP",
              "collection completed",
            ],
          },
          date: {
            type: Date,
          },
          location: String,
          DEDetails: {
            // id: {
            //   type: mongoose.Schema.Types.ObjectId,
            // },
            employeeId: {
              type: String,
            },
            name: {
              type: String,
            },
          },
        },
      ],
    },
    cheque: [
      {
        amount: Number,
        issuingBank: String,
        referenceNumber: String,
        date: Date,
        comments: String,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        stage: [
          {
            state: {
              type: String,
              default: "pending from customer",
              enum: [
                "credited to account",
                "pending from customer",
                "pending from field executive",
                "handed over to DE",
                "pending for submission",
                "submitted to bank",
                "reflected in account",
                "invoice map confirmation",
                "post to tally",
                "post to SAP",
                "collection completed",
              ],
            },
            date: {
              type: Date,
            },
            location: String,
            DEDetails: {
              //   id: {
              //     type: mongoose.Schema.Types.ObjectId,
              //   },
              employeeId: {
                type: String,
              },
              name: {
                type: String,
              },
            },
          },
        ],
      },
    ],
    demandDraft: [
      {
        amount: Number,
        issuingBank: String,
        referenceNumber: String,
        date: Date,
        comments: String,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        stage: [
          {
            state: {
              type: String,
              default: "pending from customer",
              enum: [
                "credited to account",
                "pending from customer",
                "pending from field executive",
                "handed over to DE",
                "pending for submission",
                "submitted to bank",
                "reflected in account",
                "invoice map confirmation",
                "post to tally",
                "post to SAP",
                "collection completed",
              ],
            },
            location: String,
            date: {
              type: Date,
              default: new Date(),
            },
            DEDetails: {
              //   id: {
              //     type: mongoose.Schema.Types.ObjectId,
              //   },
              employeeId: {
                type: String,
              },
              name: {
                type: String,
              },
            },
          },
        ],
      },
    ],
    online: [
      {
        amount: Number,
        issuingBank: String,
        transactionId: String,
        referenceNumber: String,
        date: Date,
        comments: String,
        stage: [
          {
            state: {
              type: String,
              default: "pending from customer",
              enum: [
                "credited to account",
                "pending from customer",
                "pending from field executive",
                "handed over to DE",
                "pending for submission",
                "submitted to bank",
                "reflected in account",
                "invoice map confirmation",
                "post to tally",
                "post to SAP",
                "collection completed",
              ],
            },
            date: {
              type: Date,
            },
            DEDetails: {
              //   id: {
              //     type: mongoose.Schema.Types.ObjectId,
              //   },
              employeeId: {
                type: String,
              },
              name: {
                type: String,
              },
            },
          },
        ],
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
      },
    ],
    invoicesIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "invoicemasters",
      },
    ],
    // invoiceIdsTally: [String]S,
    invoicesMapped: [
      {
        invoiceId: {type:mongoose.Schema.Types.ObjectId},
        invoiceNo: String,
        totalNetValue: Number,
        partialMapping: Boolean,
        location: String,
        isApprovedByDE: {
          type: Boolean,
          default: false,
        },
        sold_to_party: {
          type: String,
          required: true,
        },
        sold_to_party_description: {
          type: String,
        },
        pendingAmount: Number,
        invoiceState: {
          type: String,
          enum: ["fulfilled", "pending", "partial", "disputed"],
          default: "pending",
        },
        invoiceDate: {
          type: Date,
        },
        postStatus: {
          type: String,
        },
        paymentDocumentNumber: {
          type: Number,
        },
      },
    ],
    isSubmitted: {
      type: Boolean,
      default: false,
    },
    overAllStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    stage: {
      state: {
        type: String,
        default: "pending from field executive",
        enum: [
          "pending from customer",
          "pending from field executive",
          "handed over to DE",
          "pending for submission",
          "submitted to bank",
          "reflected in account",
          "invoice map confirmation",
          "post to tally",
          "post to SAP",
        ],
      },
      date: {
        type: Date,
        default: new Date(),
      },
    },
    logType: {
      type: String,
      enum: ["Calls", "Visits"],
    },
    logPurpose: {
      type: String,
      enum: ["Collections", "BalanceConfirmation", "Pricing"],
    },
    
    wareHouseName: {
      type: String,
    },
    distributorName: {
      type: String,
    },
    plant: {
      type: String,
    },

    // 'collectionSequence': {
    //     type: Number
    // },
    type: {
      type: "String",
      required: true,
      enum: ["cash", "cheque", "demandDraft", "online"],
    },
    comment: {
      type: String,
    },
    status: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Number,
      default: 0,
    },
    postToSAPStatus: {
      type: String,
      default: "",
    },
    sapResponse: {
      type: String,
    },
    glAccount: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
collectionSchema.plugin(autoIncrement, {
  inc_field: "collectionSequence",
  start_seq: 1000000000,
});

collectionSchema.plugin(autopopulate);


let deCollectionModel = mongoose.model("deCollections", collectionSchema);
module.exports = deCollectionModel;
