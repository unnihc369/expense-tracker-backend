import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Account from "../models/Account.js";
import CreditCard from "../models/CreditCard.js";
import Category from "../models/Category.js";

async function attachRefs(doc) {
  const t = doc.toObject ? doc.toObject() : { ...doc };
  const Model = t.accountModel === "CreditCard" ? CreditCard : Account;
  t.accountRef = await Model.findById(t.accountId).lean();
  if (t.creditCardId) {
    t.creditCardRef = await CreditCard.findById(t.creditCardId).lean();
  }
  t.description = t.merchant || "";
  t.categoryId = {
    _id: t.category,
    name: t.category,
    type: t.type === "income" ? "income" : "expense",
  };
  if (t.accountModel === "Account" && t.accountRef) {
    t.bankAccountId = {
      ...t.accountRef,
      currentAmount: t.accountRef.balance,
    };
  } else if (t.accountRef) {
    t.bankAccountId = { name: `[CC] ${t.accountRef.name}` };
  }
  return t;
}

/** Apply (forward=true) or reverse (forward=false) balance effects of a persisted transaction. */
async function applyTxToBalances(tx, forward) {
  const amt = tx.amount;
  const mul = forward ? 1 : -1;

  if (tx.type === "cc_payment") {
    const bank = await Account.findOne({ _id: tx.accountId, userId: tx.userId });
    const card = await CreditCard.findOne({ _id: tx.creditCardId, userId: tx.userId });
    if (bank) {
      bank.balance += mul * -amt;
      await bank.save();
    }
    if (card) {
      card.outstanding = Math.max(0, card.outstanding + mul * -amt);
      await card.save();
    }
    return;
  }

  if (tx.accountModel === "CreditCard") {
    const card = await CreditCard.findOne({ _id: tx.accountId, userId: tx.userId });
    if (!card) return;
    card.outstanding = Math.max(0, card.outstanding + mul * amt);
    await card.save();
    return;
  }

  const bank = await Account.findOne({ _id: tx.accountId, userId: tx.userId });
  if (!bank) return;
  if (tx.type === "expense") {
    bank.balance += mul * -amt;
  } else if (tx.type === "income") {
    bank.balance += mul * amt;
  }
  await bank.save();
}

export const createTransaction = async (req, res) => {
  try {
    let {
      type,
      amount,
      category = "other",
      merchant = "",
      note = "",
      date,
      isCreditCard = false,
      accountId,
      creditCardId,
    } = req.body;

    accountId = accountId || req.body.bankAccountId;
    if (req.body.categoryId && (!category || category === "other")) {
      const cat = await Category.findById(req.body.categoryId);
      if (cat) category = cat.name;
    }
    if (!merchant && req.body.description) {
      merchant = req.body.description;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    if (type === "cc_payment") {
      if (!accountId || !creditCardId) {
        return res.status(400).json({
          message: "cc_payment requires accountId (bank) and creditCardId",
        });
      }
      const bank = await Account.findOne({ _id: accountId, userId: req.user.id });
      const card = await CreditCard.findOne({ _id: creditCardId, userId: req.user.id });
      if (!bank || !card) {
        return res.status(404).json({ message: "Bank account or credit card not found" });
      }
      if (bank.balance < numericAmount) {
        return res.status(400).json({ message: "Insufficient bank balance" });
      }
      bank.balance -= numericAmount;
      card.outstanding = Math.max(0, card.outstanding - numericAmount);
      await bank.save();
      await card.save();

      const tx = await Transaction.create({
        userId: req.user.id,
        type: "cc_payment",
        amount: numericAmount,
        category: category || "cc_payment",
        merchant: merchant || `${card.name} bill payment`,
        note,
        date: date || new Date(),
        accountId: bank._id,
        accountModel: "Account",
        isCreditCard: false,
        creditCardId: card._id,
      });
      return res.status(201).json(await attachRefs(tx));
    }

    if (!accountId) {
      return res.status(400).json({ message: "accountId is required" });
    }

    if (type === "expense" && isCreditCard) {
      const card = await CreditCard.findOne({ _id: accountId, userId: req.user.id });
      if (!card) {
        return res.status(404).json({ message: "Credit card not found" });
      }
      card.outstanding += numericAmount;
      await card.save();

      const tx = await Transaction.create({
        userId: req.user.id,
        type: "expense",
        amount: numericAmount,
        category,
        merchant,
        note,
        date: date || new Date(),
        accountId: card._id,
        accountModel: "CreditCard",
        isCreditCard: true,
        creditCardId: null,
      });
      return res.status(201).json(await attachRefs(tx));
    }

    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ message: "Invalid type" });
    }

    const bank = await Account.findOne({ _id: accountId, userId: req.user.id });
    if (!bank) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (type === "expense") {
      if (bank.balance < numericAmount) {
        return res.status(400).json({ message: "Insufficient bank balance" });
      }
      bank.balance -= numericAmount;
    } else {
      bank.balance += numericAmount;
    }
    await bank.save();

    const tx = await Transaction.create({
      userId: req.user.id,
      type,
      amount: numericAmount,
      category,
      merchant,
      note,
      date: date || new Date(),
      accountId: bank._id,
      accountModel: "Account",
      isCreditCard: false,
      creditCardId: null,
    });
    return res.status(201).json(await attachRefs(tx));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
    const out = await Promise.all(transactions.map((t) => attachRefs(t)));
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getTransactionsByUserEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email: email.toLowerCase() }).select("_id email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await Transaction.find({ userId: user._id }).sort({ date: -1 });
    const out = await Promise.all(transactions.map((t) => attachRefs(t)));

    return res.json({
      user: { id: user._id, email: user.email },
      transactions: out,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Metadata-only updates (financial corrections: delete + recreate).
 */
export const updateTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!tx) {
      return res.status(404).json({ message: "Not found" });
    }

    if (
      req.body.amount !== undefined ||
      req.body.type !== undefined ||
      req.body.accountId !== undefined ||
      req.body.isCreditCard !== undefined ||
      req.body.creditCardId !== undefined
    ) {
      return res.status(400).json({
        message:
          "Changing amount, type, accounts, or card flags is not supported. Delete the transaction and create a new one.",
      });
    }

    const { category, merchant, note, date } = req.body;
    if (category !== undefined) tx.category = category;
    if (merchant !== undefined) tx.merchant = merchant;
    if (note !== undefined) tx.note = note;
    if (date !== undefined) tx.date = date;

    await tx.save();
    return res.json(await attachRefs(tx));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!tx) {
      return res.status(404).json({ message: "Not found" });
    }

    await applyTxToBalances(tx, false);
    await tx.deleteOne();

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
