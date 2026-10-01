import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    acceptingRequests: {
      type: Boolean,
      default: true
    },

    weatherMode: {
      type: String,
      enum: ["NORMAL", "RAIN"],
      default: "NORMAL"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Settings", settingsSchema);
