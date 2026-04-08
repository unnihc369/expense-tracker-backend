import mongoose from "mongoose";
import Account from "../models/Account.js";
import CreditCard from "../models/CreditCard.js";
import Transaction from "../models/Transaction.js";

function monthBounds(ym) {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end };
}

function currentYm() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function userObjectId(req) {
  return new mongoose.Types.ObjectId(String(req.user.id));
}

export const getSummary = async (req, res) => {
  try {
    const ym = req.query.month || currentYm();
    const { start, end } = monthBounds(ym);

    const accounts = await Account.find({ userId: req.user.id }).lean();
    const cards = await CreditCard.find({ userId: req.user.id }).lean();

    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    const ccOutstanding = cards.reduce((s, c) => s + (c.outstanding || 0), 0);

    const monthTx = await Transaction.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    }).lean();

    const monthIncome = monthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const monthSpend = monthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    return res.json({
      month: ym,
      totalBalance,
      ccOutstanding,
      netAssets: totalBalance - ccOutstanding,
      monthIncome,
      monthSpend,
      netFlow: monthIncome - monthSpend,
      incomeCount: monthTx.filter((t) => t.type === "income").length,
      expenseCount: monthTx.filter((t) => t.type === "expense").length,
      accountCount: accounts.length,
      cardCount: cards.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getTrends = async (req, res) => {
  try {
    const months = Number(req.query.months) || 6;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const uid = userObjectId(req);

    const agg = await Transaction.aggregate([
      {
        $match: {
          userId: uid,
          type: "expense",
          date: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            y: { $year: "$date" },
            m: { $month: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]);

    const labels = [];
    const values = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const found = agg.find((x) => x._id.y === y && x._id.m === m);
      labels.push(d.toLocaleString("en", { month: "short" }));
      values.push(found ? found.total : 0);
    }

    return res.json({ labels, values, months });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getCategoryBreakdown = async (req, res) => {
  try {
    const ym = req.query.month || currentYm();
    const { start, end } = monthBounds(ym);
    const uid = userObjectId(req);

    const agg = await Transaction.aggregate([
      {
        $match: {
          userId: uid,
          type: "expense",
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return res.json({
      month: ym,
      categories: agg.map((r) => ({ category: r._id, total: r.total })),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
