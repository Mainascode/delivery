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

    // Delivery fee saved when the customer creates the order.
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },

    // Actual amount spent by the operator purchasing goods.
    shoppingCost: {
      type: Number,
      default: null,
      min: 0,
    },

    // Calculated by the backend: shoppingCost + deliveryFee.
    totalAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    shoppingCostEnteredAt: {
      type: Date,
      default: null,
    },

    shoppingCostEnteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ["MPESA", "MANUAL"],
      default: null,
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
        "READY_FOR_DELIVERY",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
      ],
      default: "PENDING",
      index: true,
    },

    paymentRequestInProgress: {
  type: Boolean,
  default: false,
},

activeMpesaPayment: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "MpesaPayment",
  default: null,
},

    // Existing payment statuses retained for compatibility.
    paymentStatus: {
      type: String,
      enum: [
        "UNPAID",
        "CUSTOMER_MARKED_PAID",
        "CONFIRMED",
      ],
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