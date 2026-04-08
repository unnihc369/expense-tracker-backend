import mongoose from "mongoose";

const creditCardSchema = new mongoose.Schema(
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
    limit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    outstanding: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    color: {
      type: String,
      default: "#D4537E",
      trim: true,
    },
  },
  { timestamps: true }
);

creditCardSchema.index({ userId: 1, createdAt: -1 });

const CreditCard = mongoose.model("CreditCard", creditCardSchema);

export default CreditCard;
