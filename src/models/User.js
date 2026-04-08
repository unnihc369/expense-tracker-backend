import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    /** SHA-256 hex of the raw verification token sent by email */
    verificationTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    verificationTokenExpiry: {
      type: Date,
      default: null,
    },
    /** Legacy plain token (pre-migration); verify endpoint still accepts until cleared */
    verificationToken: {
      type: String,
      default: null,
    },
    /** SHA-256 hex of opaque refresh token */
    refreshTokenHash: {
      type: String,
      default: null,
    },
    refreshTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
