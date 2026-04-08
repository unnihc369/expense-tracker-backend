import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      default: "savings",
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    color: {
      type: String,
      default: "#1D9E75",
      trim: true,
    },
  },
  { timestamps: true }
);

accountSchema.index({ userId: 1, createdAt: -1 });

const Account = mongoose.model("Account", accountSchema);

export default Account;
