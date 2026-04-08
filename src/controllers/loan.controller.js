import Loan from "../models/Loan.js";
import Account from "../models/Account.js";

export const createLoan = async (req, res) => {
  try {
    const { name, direction, amount, remaining, accountId, status, note, date } = req.body;
    if (!name || !direction || amount == null) {
      return res.status(400).json({ message: "name, direction, amount required" });
    }

    let accId = accountId || null;
    if (accId) {
      const acc = await Account.findOne({ _id: accId, userId: req.user.id });
      if (!acc) return res.status(404).json({ message: "Account not found" });
    }

    const rem = remaining != null ? Number(remaining) : Number(amount);
    const loan = await Loan.create({
      name,
      direction,
      amount: Number(amount),
      remaining: rem,
      accountId: accId,
      status: status || (rem <= 0 ? "settled" : "active"),
      note: note || "",
      date: date || new Date(),
      userId: req.user.id,
    });

    return res.status(201).json(loan);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(loans);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    return res.json(loan);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateLoan = async (req, res) => {
  try {
    const patch = { ...req.body };
    delete patch.userId;
    if (patch.remaining !== undefined) {
      patch.remaining = Number(patch.remaining);
      if (patch.remaining <= 0) patch.status = "settled";
    }

    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      patch,
      { new: true }
    );
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    return res.json(loan);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const recordLoanPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      return res.status(400).json({ message: "Positive amount required" });
    }

    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    loan.remaining = Math.max(0, loan.remaining - n);
    if (loan.remaining <= 0) loan.status = "settled";
    await loan.save();
    return res.json(loan);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    return res.json({ message: "Loan deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
