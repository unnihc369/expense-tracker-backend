import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["expense", "income", "cc_payment"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      default: "other",
      trim: true,
    },
    merchant: {
      type: String,
      default: "",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    /**
     * Bank/cash account (income, expense from bank, or source account for cc_payment).
     * When isCreditCard is true for expense, this ObjectId references CreditCard.
     */
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "accountModel",
    },
    accountModel: {
      type: String,
      enum: ["Account", "CreditCard"],
      required: true,
      default: "Account",
    },
    isCreditCard: {
      type: Boolean,
      default: false,
    },
    /** Target card when type === cc_payment (payment reduces outstanding). */
    creditCardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreditCard",
      default: null,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
