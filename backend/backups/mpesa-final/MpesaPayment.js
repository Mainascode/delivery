
import mongoose from "mongoose";

const mpesaPaymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "INITIATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "TIMEOUT",
      ],
      default: "INITIATED",
      index: true,
    },

    merchantRequestId: {
      type: String,
      default: undefined,
    },

    checkoutRequestId: {
      type: String,
      default: undefined,
    },

    mpesaReceiptNumber: {
      type: String,
      default: undefined,
    },

    transactionDate: {
      type: Date,
      default: null,
    },

    resultCode: {
      type: Number,
      default: null,
    },

    resultDescription: {
      type: String,
      default: "",
    },

    callbackReceivedAt: {
      type: Date,
      default: null,
    },

    callbackPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

mpesaPaymentSchema.index(
  { checkoutRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      checkoutRequestId: { $type: "string" },
    },
  }
);

mpesaPaymentSchema.index(
  { mpesaReceiptNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      mpesaReceiptNumber: { $type: "string" },
    },
  }
);

mpesaPaymentSchema.index({ order: 1, createdAt: -1 });
mpesaPaymentSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.model("MpesaPayment", mpesaPaymentSchema);
