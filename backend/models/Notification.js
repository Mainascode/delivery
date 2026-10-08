import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "ORDER_CREATED",
        "ORDER_ACCEPTED",
        "ORDER_UPDATED",
        "PRICE_CONFIRMED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "SYSTEM",
      ],
      default: "SYSTEM",
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
