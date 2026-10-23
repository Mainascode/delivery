
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: String,
      required: true,
      trim: true,
    },

    pickupLocation: {
      type: String,
      default: "",
      trim: true,
    },

    deliveryLocation: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    deliveryFee: {
      type: Number,
      required: true,
    },

    pricingMode: {
      type: String,
      enum: ["NORMAL", "RAIN"],
      required: true,
    },

    pricingRule: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "SHOPPING",
        "OUT_FOR_DELIVERY",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
      ],
      default: "PENDING",
      index: true,
    },

    // UNPAID -> CUSTOMER_MARKED_PAID -> CONFIRMED
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "CUSTOMER_MARKED_PAID", "CONFIRMED"],
      default: "UNPAID",
      index: true,
    },

    paymentSubmittedAt: {
      type: Date,
      default: null,
    },

    paymentConfirmedAt: {
      type: Date,
      default: null,
    },

    paymentConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
