import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true
    },

    phone: {
      type: String,
      default: ""
    },

    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN"],
      default: "CUSTOMER"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);
