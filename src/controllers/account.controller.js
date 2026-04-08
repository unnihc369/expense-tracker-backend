import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Loan from "../models/Loan.js";

/** Maps to legacy `bank-accounts` API shape for existing clients. */
export function toLegacyBankShape(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  return {
    ...o,
    currentAmount: o.balance,
    initialAmount: o.balance,
  };
}

export const createAccount = async (req, res) => {
  try {
    const { name, type = "savings", balance = 0, color, initialAmount } = req.body;
    const bal = Number(balance ?? initialAmount ?? 0);

    const account = await Account.create({
      name,
      type,
      balance: bal,
      color: color || "#1D9E75",
      userId: req.user.id,
    });

    return res.status(201).json(toLegacyBankShape(account));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(accounts.map((a) => toLegacyBankShape(a)));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.json(toLegacyBankShape(account));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { name, type, balance, color } = req.body;
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (type !== undefined) patch.type = type;
    if (balance !== undefined) patch.balance = Number(balance);
    if (color !== undefined) patch.color = color;

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      patch,
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.json(toLegacyBankShape(account));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const count = await Transaction.countDocuments({
      userId: req.user.id,
      accountModel: "Account",
      accountId: account._id,
    });

    if (count > 0) {
      return res.status(400).json({
        message: "Cannot delete account with linked transactions",
      });
    }

    const loanCount = await Loan.countDocuments({
      userId: req.user.id,
      accountId: account._id,
    });
    if (loanCount > 0) {
      return res.status(400).json({
        message: "Cannot delete account referenced by loans",
      });
    }

    await account.deleteOne();
    return res.json({ message: "Account deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
