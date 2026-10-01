import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: {
      type: String,
      required: true
    },

    pickupLocation: {
      type: String,
      default: ""
    },

    deliveryLocation: {
      type: String,
      required: true
    },

    notes: {
      type: String,
      default: ""
    },

    deliveryFee: {
      type: Number,
      required: true
    },

    pricingMode: {
      type: String,
      enum: ["NORMAL", "RAIN"],
      required: true
    },

    pricingRule: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "SHOPPING",
        "OUT_FOR_DELIVERY",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "PENDING"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Order", orderSchema);
